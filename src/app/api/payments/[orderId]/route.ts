// =============================================================
// GET /api/payments/[orderId] — status dari DB; sinkronkan ke
// Pakasir max 1x per 4 detik bila masih PENDING.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus } from "@/lib/pakasir";
import { fulfillPakasirPayment } from "@/lib/pakasir-fulfillment";
import { classifyPaymentError, logPaymentError } from "@/lib/payment-api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYNC_INTERVAL_MS = 4_000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const payment = await prisma.pakasirPayment.findUnique({
      where: { orderId },
    });
    if (!payment)
      return NextResponse.json({ message: "Pembayaran tidak ditemukan." }, { status: 404 });

    let synced = false;
    if (payment.status === "PENDING") {
      const last = payment.lastCheckedAt?.getTime() ?? 0;
      if (Date.now() - last >= SYNC_INTERVAL_MS) {
        try {
          const remote = await getTransactionStatus(payment.txnId);
          synced = true;
          await prisma.$transaction(async (tx) => {
            const db = tx as typeof prisma;
            await db.pakasirPayment.update({
              where: { id: payment.id },
              data: {
                lastCheckedAt: new Date(),
                ...(remote.status === "canceled" ? { status: "CANCELED" } : {}),
              },
            });
            if (remote.status === "completed") {
              await fulfillPakasirPayment(tx as never, payment.id, {
                isSandbox: remote.is_sandbox,
                completedAt: remote.completed_at ? new Date(remote.completed_at) : new Date(),
              });
            }
          });
        } catch (err) {
          // Gagal sinkron: tetap kembalikan data DB + tandai waktu cek
          // agar tidak menabrak rate limit 1 req / 4 detik.
          console.warn("[GET /api/payments/:orderId] sync gagal:", err);
          await prisma.pakasirPayment.update({
            where: { id: payment.id },
            data: { lastCheckedAt: new Date() },
          });
        }
      }
    }

    const fresh = await prisma.pakasirPayment.findUnique({ where: { orderId } });
    return NextResponse.json({
      payment: fresh
        ? {
            orderId: fresh.orderId,
            pwaOrderId: fresh.pwaOrderId,
            txnId: fresh.txnId,
            method: fresh.method,
            amount: fresh.amount,
            fee: fresh.fee,
            totalPayment: fresh.totalPayment,
            status: fresh.status,
            paymentLink: fresh.paymentLink,
            qrString: fresh.qrString,
            vaNumber: fresh.vaNumber,
            expiredAt: fresh.expiredAt?.toISOString() ?? null,
            isSandbox: fresh.isSandbox,
            completedAt: fresh.completedAt?.toISOString() ?? null,
          }
        : null,
      synced,
    });
  } catch (error) {
    const res = classifyPaymentError(error, "GET /api/payments/:orderId");
    logPaymentError("GET /api/payments/:orderId", error, res);
    return NextResponse.json(res.body, { status: res.status });
  }
}
