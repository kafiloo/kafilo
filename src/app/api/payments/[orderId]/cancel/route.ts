// =============================================================
// POST /api/payments/[orderId]/cancel — batalkan bila PENDING.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelTransaction } from "@/lib/pakasir";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const payment = await prisma.pakasirPayment.findUnique({ where: { orderId } });
    if (!payment)
      return NextResponse.json({ message: "Pembayaran tidak ditemukan." }, { status: 404 });
    if (payment.status !== "PENDING")
      return NextResponse.json(
        { message: `Transaksi sudah ${payment.status}, tidak bisa dibatalkan.` },
        { status: 409 }
      );

    const remote = await cancelTransaction(payment.txnId);
    await prisma.pakasirPayment.update({
      where: { id: payment.id },
      data: { status: "CANCELED" },
    });
    return NextResponse.json({ message: remote.message ?? "Transaksi dibatalkan." });
  } catch (error) {
    console.error("[POST /api/payments/:orderId/cancel]", error);
    return NextResponse.json({ message: "Gagal membatalkan transaksi." }, { status: 500 });
  }
}
