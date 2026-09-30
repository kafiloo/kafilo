// =============================================================
// GET /api/payments/health — diagnosa konfigurasi pembayaran.
// Dibuka langsung di browser (production): laporkan apakah env,
// tabel DB, dan API Pakasir siap. TIDAK pernah membocorkan nilai
// secret — hanya boolean / jumlah.
// =============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPakasirEnvStatus, REQUIRED_PAYMENT_ENV } from "@/lib/env";
import { getPaymentFees } from "@/lib/pakasir";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROBE_AMOUNT = 10_000;

export async function GET() {
  const envStatus = getPakasirEnvStatus();

  // 1. Env — hanya keberadaan, bukan nilainya.
  const env = {
    ...Object.fromEntries(
      REQUIRED_PAYMENT_ENV.map((name) => [name, Boolean(process.env[name]?.trim())])
    ),
    PAKASIR_BASE_URL: envStatus.baseUrl,
    PAKASIR_ALLOW_SANDBOX_FULFILLMENT:
      process.env.PAKASIR_ALLOW_SANDBOX_FULFILLMENT === "true",
    DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
    JWT_SECRET: Boolean(process.env.JWT_SECRET?.trim()),
    missing: envStatus.missing,
  };

  // 2. Database — koneksi + tabel pakasir_payments.
  const db: {
    reachable: boolean;
    pakasirPaymentsTable: boolean;
    pendingPayments: number | null;
    error?: string;
  } = { reachable: false, pakasirPaymentsTable: false, pendingPayments: null };
  try {
    db.pendingPayments = await prisma.pakasirPayment.count({ where: { status: "PENDING" } });
    db.reachable = true;
    db.pakasirPaymentsTable = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    db.reachable = !/P1001|P1002|P1008|P1017|Can't reach database/i.test(message);
    db.pakasirPaymentsTable = false;
    db.error = /P2021|does not exist/i.test(message)
      ? "Tabel pakasir_payments belum ada — jalankan `npx prisma migrate deploy`."
      : message.slice(0, 200);
  }

  // 3. Pakasir — endpoint publik payment-fee (tanpa API key).
  const pakasir: {
    reachable: boolean;
    probeAmount: number;
    feeCount: number | null;
    error?: string;
  } = { reachable: false, probeAmount: PROBE_AMOUNT, feeCount: null };
  if (envStatus.missing.length === 0) {
    try {
      const fees = await getPaymentFees(PROBE_AMOUNT);
      pakasir.reachable = true;
      pakasir.feeCount = Object.keys(fees).length;
    } catch (error) {
      pakasir.error = (error instanceof Error ? error.message : String(error)).slice(0, 200);
    }
  } else {
    pakasir.error = "Dilewati: env Pakasir belum lengkap.";
  }

  const ok = env.missing.length === 0 && db.pakasirPaymentsTable && pakasir.reachable;

  return NextResponse.json(
    { ok, scope: "payments", checkedAt: new Date().toISOString(), env, db, pakasir },
    { status: 200 }
  );
}
