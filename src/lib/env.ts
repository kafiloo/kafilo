// =============================================================
// lib/env.ts — Validasi environment variable terpusat
// Semua akses env Pakasir HANYA dari server. File ini diimpor
// oleh server-only code (lib/pakasir.ts & route handlers).
// Melempar error jelas jika ada yang kosong.
// =============================================================

/**
 * Error env yang bisa diklasifikasi oleh route handler sehingga
 * pesan 500 di production langsung menyebut variabel yang hilang.
 */
export class MissingEnvError extends Error {
  readonly vars: string[];
  constructor(vars: string[]) {
    super(
      `[env] ${vars.join(", ")} belum di-set. Tambahkan ke .env / .env.local ` +
        `(lokal) atau Environment Variables project di Vercel (production), lalu redeploy.`
    );
    this.name = "MissingEnvError";
    this.vars = vars;
  }
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value || value.trim() === "") {
    throw new MissingEnvError([name]);
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") return fallback;
  return value.trim();
}

export interface PakasirEnv {
  slug: string;
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
}

/** Nama variabel yang wajib ada agar pembayaran bisa jalan. */
export const REQUIRED_PAYMENT_ENV = [
  "PAKASIR_SLUG",
  "PAKASIR_API_KEY",
  "PAKASIR_WEBHOOK_SECRET",
] as const;

/**
 * Cek keberadaan env tanpa melempar error — dipakai oleh
 * GET /api/payments/health untuk diagnosis cepat di production.
 */
export function getPakasirEnvStatus(): {
  missing: string[];
  baseUrl: string;
} {
  const missing = REQUIRED_PAYMENT_ENV.filter((name) => {
    const value = process.env[name];
    return !value || value.trim() === "";
  });
  return {
    missing,
    baseUrl: optional("PAKASIR_BASE_URL", "https://app.pakasir.com").replace(/\/+$/, ""),
  };
}

/**
 * Ambil & validasi env Pakasir. Panggil hanya dari server
 * (route handler / server action / lib server-only).
 * @throws MissingEnvError jika PAKASIR_SLUG / PAKASIR_API_KEY /
 * PAKASIR_WEBHOOK_SECRET kosong.
 */
export function getPakasirEnv(): PakasirEnv {
  const missing = REQUIRED_PAYMENT_ENV.filter((name) => {
    const value = process.env[name];
    return !value || value.trim() === "";
  });
  if (missing.length > 0) throw new MissingEnvError([...missing]);
  return {
    slug: required("PAKASIR_SLUG"),
    apiKey: required("PAKASIR_API_KEY"),
    webhookSecret: required("PAKASIR_WEBHOOK_SECRET"),
    baseUrl: optional("PAKASIR_BASE_URL", "https://app.pakasir.com").replace(
      /\/+$/,
      ""
    ),
  };
}

/**
 * Validasi env inti saat boot server. Hanya mewajibkan variabel
 * yang benar-benar dipakai: DATABASE_URL, JWT_SECRET, PAKASIR_*.
 */
export function assertServerEnv(): void {
  required("DATABASE_URL");
  required("JWT_SECRET");
  getPakasirEnv();
}
