// =============================================================
// GET /api/payments/fees?amount= — proxy ke payment-fee Pakasir.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { getPaymentFees } from "@/lib/pakasir";
import { classifyPaymentError, logPaymentError } from "@/lib/payment-api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const amount = Number(new URL(req.url).searchParams.get("amount"));
    if (!Number.isInteger(amount) || amount <= 0)
      return NextResponse.json(
        { reason: "INPUT_INVALID", message: "Query ?amount= harus integer positif (rupiah)." },
        { status: 400 }
      );
    const fees = await getPaymentFees(amount);
    return NextResponse.json({ amount, fees });
  } catch (error) {
    const res = classifyPaymentError(error, "GET /api/payments/fees");
    logPaymentError("GET /api/payments/fees", error, res);
    return NextResponse.json(res.body, { status: res.status });
  }
}
