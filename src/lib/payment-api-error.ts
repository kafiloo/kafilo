// =============================================================
// lib/payment-api-error.ts — klasifikasi error API pembayaran
// (server-only, dipakai oleh /api/payments*).
// Tujuan: pesan 500/502 yang ACTIONABLE di production — langsung
// menyebut penyebabnya (env belum di-set, migrasi DB belum jalan,
// API key Pakasir ditolak, Pakasir tidak bisa dihubungi).
// Nilai secret tidak pernah ikut ke response/log.
// =============================================================

import { MissingEnvError } from "@/lib/env";
import {
  PakasirError,
  PakasirNetworkError,
  PakasirValidationError,
} from "@/lib/pakasir";

export type PaymentErrorReason =
  | "INPUT_INVALID"
  | "AMOUNT_OUT_OF_RANGE"
  | "ENV_MISSING"
  | "DB_MIGRATION_REQUIRED"
  | "DB_UNREACHABLE"
  | "PAKASIR_REJECTED"
  | "PAKASIR_UNREACHABLE"
  | "INTERNAL";

export interface PaymentErrorBody {
  message: string;
  reason: PaymentErrorReason;
  /** Detail teknis (sudah di-redact) — untuk debugging, bukan untuk customer. */
  detail?: string;
  /** Variabel env yang belum di-set (reason = ENV_MISSING). */
  missing?: string[];
  /** HTTP status dari Pakasir (reason = PAKASIR_REJECTED). */
  pakasirStatus?: number;
}

export interface PaymentErrorResponse {
  status: number;
  body: PaymentErrorBody;
}

const MAX_DETAIL = 220;

/** Buang nilai secret bila ikut tercebur ke pesan error. */
function redact(text: string): string {
  let out = text;
  for (const name of ["PAKASIR_API_KEY", "PAKASIR_WEBHOOK_SECRET"]) {
    const value = process.env[name];
    if (value && value.length >= 8) out = out.split(value).join("***");
  }
  return out.length > MAX_DETAIL ? `${out.slice(0, MAX_DETAIL)}…` : out;
}

function prismaCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

/** Prisma: tabel belum ada = migrasi belum di-deploy ke DB tujuan. */
function isMissingTable(error: unknown): boolean {
  if (prismaCode(error) === "P2021") return true;
  const message = error instanceof Error ? error.message : "";
  return /relation .* does not exist|table .* does not exist/i.test(message);
}

/**
 * Ubah error apa pun menjadi response JSON yang aman + informatif.
 * @param scope label log, contoh "POST /api/payments".
 */
export function classifyPaymentError(
  error: unknown,
  scope: string
): PaymentErrorResponse {
  // 1. Env belum lengkap (penyebab 500 paling umum setelah deploy).
  if (error instanceof MissingEnvError) {
    return {
      status: 500,
      body: {
        reason: "ENV_MISSING",
        missing: error.vars,
        message:
          `Konfigurasi pembayaran belum lengkap: ${error.vars.join(", ")} ` +
          `belum di-set di environment server. Cek GET /api/payments/health, ` +
          `set variabel tersebut di Environment Variables project (Vercel), lalu redeploy.`,
      },
    };
  }
  // Env error dari pakasir.ts juga bisa datang sebagai Error biasa.
  if (error instanceof Error && error.message.includes("[env]")) {
    const vars = error.message.match(/PAKASIR_[A-Z_]+/g) ?? [];
    return {
      status: 500,
      body: {
        reason: "ENV_MISSING",
        missing: vars.length > 0 ? vars : undefined,
        message: error.message.replace(/\[env\]\s*/, "Env belum lengkap: "),
      },
    };
  }

  // 2. Nominal di luar batas metode (400, bukan 500).
  if (error instanceof PakasirValidationError) {
    return {
      status: 400,
      body: { reason: "AMOUNT_OUT_OF_RANGE", message: error.message },
    };
  }

  // 3. Pakasir tidak bisa dihubungi / timeout.
  if (error instanceof PakasirNetworkError) {
    return {
      status: 503,
      body: {
        reason: "PAKASIR_UNREACHABLE",
        message:
          "Server pembayaran (Pakasir) tidak bisa dihubungi. Coba lagi sebentar lagi.",
        detail: redact(error.message),
      },
    };
  }

  // 4. Pakasir menolak permintaan (API key salah, slug salah, dll).
  if (error instanceof PakasirError) {
    const status = error.status;
    const hint =
      status === 401 || status === 403
        ? "Periksa PAKASIR_SLUG & PAKASIR_API_KEY."
        : status === 404
          ? "Periksa PAKASIR_SLUG (project tidak ditemukan)."
          : status === 429
            ? "Terlalu banyak permintaan ke Pakasir."
            : "Periksa konfigurasi project di dashboard Pakasir.";
    return {
      status: 502,
      body: {
        reason: "PAKASIR_REJECTED",
        pakasirStatus: status,
        message: `Pakasir menolak permintaan (HTTP ${status ?? "?"}). ${hint}`,
        detail: redact(error.message),
      },
    };
  }

  // 5. Masalah database.
  if (isMissingTable(error)) {
    return {
      status: 500,
      body: {
        reason: "DB_MIGRATION_REQUIRED",
        message:
          "Tabel pembayaran belum ada di database. Jalankan " +
          "`npx prisma migrate deploy` ke database tujuan, lalu coba lagi.",
        detail: redact(error instanceof Error ? error.message : ""),
      },
    };
  }
  const code = prismaCode(error);
  if (code && ["P1000", "P1001", "P1002", "P1008", "P1017"].includes(code)) {
    return {
      status: 503,
      body: {
        reason: "DB_UNREACHABLE",
        message: "Database tidak bisa dihubungi. Coba lagi sebentar lagi.",
        detail: `prisma ${code}`,
      },
    };
  }

  console.error(`[${scope}] error tak terklasifikasi:`, error);
  return {
    status: 500,
    body: {
      reason: "INTERNAL",
      message: "Gagal membuat pembayaran.",
      detail: redact(error instanceof Error ? error.message : String(error)),
    },
  };
}

/** Log sekali di server; env/DB/Pakasir tetap dicatat agar terlihat di Vercel. */
export function logPaymentError(
  scope: string,
  error: unknown,
  res: PaymentErrorResponse
): void {
  const line = `[${scope}] ${res.body.reason}: ${res.body.detail ?? res.body.message}`;
  if (res.status >= 500) console.error(line, error);
  else console.warn(line);
}
