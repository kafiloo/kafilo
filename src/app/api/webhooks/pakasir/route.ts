// =============================================================
// POST /api/webhooks/pakasir — webhook Pakasir -> server kita.
// 1. timingSafeEqual X-Secret, 2. zod body, 3. cocokkan amount,
// 4. konfirmasi transaction-status, 5. idempotent, atomik,
// 6. sandbox tidak memenuhi order di production. Balas 200.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPakasirEnv } from "@/lib/env";
import { getTransactionStatus } from "@/lib/pakasir";
import { fulfillPakasirPayment } from "@/lib/pakasir-fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WebhookSchema = z.object({
  txn_id: z.string().min(1),
  order_id: z.string().min(1),
  amount: z.number().int().positive(),
  is_sandbox: z.boolean(),
  status: z.literal("completed"),
  completed_at: z.string().nullable().optional(),
});

function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    let expectedSecret: string;
    try {
      expectedSecret = getPakasirEnv().webhookSecret;
    } catch {
      console.error("[webhook/pakasir] PAKASIR_WEBHOOK_SECRET belum di-set.");
      return NextResponse.json({ message: "Webhook belum dikonfigurasi." }, { status: 500 });
    }

    if (!secretMatches(req.headers.get("X-Secret"), expectedSecret)) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = WebhookSchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[webhook/pakasir] Body tidak valid.");
      return NextResponse.json({ message: "OK" }, { status: 200 });
    }
    const body = parsed.data;

    const payment = await prisma.pakasirPayment.findFirst({
      where: { OR: [{ orderId: body.order_id }, { txnId: body.txn_id }] },
    });
    if (!payment) {
      console.warn("[webhook/pakasir] Pembayaran tidak ditemukan untuk webhook.");
      return NextResponse.json({ message: "OK" }, { status: 200 });
    }

    // Cocokkan amount dengan DB — jika beda, jangan tandai lunas.
    if (payment.amount !== body.amount) {
      console.warn("[webhook/pakasir] Amount mismatch — pembayaran TIDAK ditandai lunas.");
      return NextResponse.json({ message: "OK" }, { status: 200 });
    }

    // Idempotent: sudah COMPLETED -> langsung 200.
    if (payment.status === "COMPLETED") {
      return NextResponse.json({ message: "OK" }, { status: 200 });
    }

    // Konfirmasi ulang via transaction-status sebelum COMPLETED.
    try {
      const remote = await getTransactionStatus(payment.txnId);
      if (remote.status !== "completed") {
        if (remote.status === "canceled") {
          await prisma.pakasirPayment.update({
            where: { id: payment.id },
            data: { status: "CANCELED" },
          });
        }
        return NextResponse.json({ message: "OK" }, { status: 200 });
      }
      if (remote.amount !== payment.amount) {
        console.warn("[webhook/pakasir] Amount remote mismatch — tidak ditandai lunas.");
        return NextResponse.json({ message: "OK" }, { status: 200 });
      }
      await prisma.$transaction(async (tx) => {
        await fulfillPakasirPayment(tx as never, payment.id, {
          isSandbox: remote.is_sandbox,
          completedAt: remote.completed_at ? new Date(remote.completed_at) : new Date(),
        });
      });
    } catch (err) {
      console.error("[webhook/pakasir] Konfirmasi status gagal:", err);
      return NextResponse.json({ message: "OK" }, { status: 200 });
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/webhooks/pakasir]", error);
    // Selalu 200 agar Pakasir tidak retry membabi-buta (kecuali 401 di atas).
    return NextResponse.json({ message: "OK" }, { status: 200 });
  }
}
