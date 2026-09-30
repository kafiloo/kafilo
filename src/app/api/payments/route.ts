// =============================================================
// POST /api/payments — buat transaksi Pakasir.
// Nominal diambil dari database (JANGAN percaya amount client).
// Mendukung 2 sumber nominal server-side:
//  1. pwaOrderId  -> pakai totalAmount PwaOrder (checkout PWA)
//  2. planId      -> pakai harga paket langganan (checkout SaaS)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  PAKASIR_METHODS,
  assertPakasirAmount,
  buildPaymentLink,
  createTransaction,
} from "@/lib/pakasir";
import { generatePakasirOrderId } from "@/lib/pakasir-order";
import { PLANS, type PlanId } from "@/lib/plans";
import { classifyPaymentError, logPaymentError } from "@/lib/payment-api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  method: z.enum(PAKASIR_METHODS as unknown as [string, ...string[]]),
  pwaOrderId: z.string().min(1).optional(),
  planId: z.string().min(1).optional(),
  qrisOnly: z.boolean().optional(),
  redirectUrl: z.string().url().max(2048).optional(),
});

function toSafe(row: {
  orderId: string;
  pwaOrderId: string | null;
  txnId: string;
  method: string;
  amount: number;
  fee: number;
  totalPayment: number;
  status: string;
  paymentLink: string | null;
  qrString: string | null;
  vaNumber: string | null;
  expiredAt: Date | null;
  isSandbox: boolean;
  completedAt: Date | null;
}) {
  return {
    orderId: row.orderId,
    pwaOrderId: row.pwaOrderId,
    txnId: row.txnId,
    method: row.method,
    amount: row.amount,
    fee: row.fee,
    totalPayment: row.totalPayment,
    status: row.status,
    paymentLink: row.paymentLink,
    qrString: row.qrString,
    vaNumber: row.vaNumber,
    expiredAt: row.expiredAt?.toISOString() ?? null,
    isSandbox: row.isSandbox,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Input tidak valid", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { method, pwaOrderId, planId, qrisOnly, redirectUrl } = parsed.data;

    // Ambil nominal dari server — jangan percaya amount dari client.
    let amount: number;
    let linkPwaOrderId: string | null = null;
    if (pwaOrderId) {
      const order = await prisma.pwaOrder.findUnique({
        where: { id: pwaOrderId },
        select: { id: true, totalAmount: true, status: true },
      });
      if (!order)
        return NextResponse.json({ message: "PwaOrder tidak ditemukan." }, { status: 404 });
      if (order.status !== "PENDING_CONFIRMATION")
        return NextResponse.json(
          { message: "Pesanan sudah diproses, tidak bisa dibuatkan pembayaran baru." },
          { status: 409 }
        );
      amount = order.totalAmount;
      linkPwaOrderId = order.id;
    } else if (planId) {
      const plan = PLANS.find((p) => p.id === (planId as PlanId));
      if (!plan)
        return NextResponse.json({ message: "planId tidak dikenal." }, { status: 400 });
      amount = plan.price;
    } else {
      return NextResponse.json(
        { message: "pwaOrderId atau planId wajib diisi (nominal diambil dari server)." },
        { status: 400 }
      );
    }

    try {
      assertPakasirAmount(method as (typeof PAKASIR_METHODS)[number], amount);
    } catch (e) {
      return NextResponse.json(
        {
          reason: "AMOUNT_OUT_OF_RANGE",
          message: e instanceof Error ? e.message : "Nominal di luar batas metode.",
        },
        { status: 400 }
      );
    }

    // Idempotensi: jika PwaOrder ini sudah punya payment PENDING, pakai ulang.
    // (Hanya untuk pwaOrderId; pembayaran planId selalu buat transaksi baru.)
    if (linkPwaOrderId) {
      const existing = await prisma.pakasirPayment.findFirst({
        where: { pwaOrderId: linkPwaOrderId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
      if (existing && existing.method === method) {
        return NextResponse.json({ payment: toSafe(existing), reused: true }, { status: 200 });
      }
    }

    const orderId = generatePakasirOrderId();
    const result = await createTransaction(orderId, {
      method: method as (typeof PAKASIR_METHODS)[number],
      amount,
    });

    const saved = await prisma.pakasirPayment.create({
      data: {
        orderId,
        pwaOrderId: linkPwaOrderId,
        txnId: result.txn_id,
        method,
        amount,
        fee: result.kind === "payment_link" ? 0 : result.fee,
        totalPayment: result.kind === "payment_link" ? amount : result.total_payment,
        status: "PENDING",
        paymentLink:
          result.kind === "payment_link"
            ? buildPaymentLink(result.payment_link, { qrisOnly, redirectUrl })
            : null,
        qrString: result.kind === "payment_link" ? null : result.qr_string,
        vaNumber: result.kind === "payment_link" ? null : result.va_number,
        expiredAt:
          result.kind === "payment_link" || !result.expired_at
            ? null
            : new Date(result.expired_at),
        isSandbox: result.kind === "payment_link" ? false : result.is_sandbox,
      },
    });

    return NextResponse.json({ payment: toSafe(saved), reused: false }, { status: 201 });
  } catch (error) {
    const res = classifyPaymentError(error, "POST /api/payments");
    logPaymentError("POST /api/payments", error, res);
    return NextResponse.json(res.body, { status: res.status });
  }
}
