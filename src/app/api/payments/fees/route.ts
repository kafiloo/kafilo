// =============================================================
// GET /api/payments/fees?amount= — proxy ke payment-fee Pakasir.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { getPaymentFees, PakasirValidationError } from "@/lib/pakasir";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const amount = Number(new URL(req.url).searchParams.get("amount"));
    if (!Number.isInteger(amount) || amount <= 0)
      return NextResponse.json(
        { message: "Query ?amount= harus integer positif (rupiah)." },
        { status: 400 }
      );
    const fees = await getPaymentFees(amount);
    return NextResponse.json({ amount, fees });
  } catch (error) {
    if (error instanceof PakasirValidationError)
      return NextResponse.json({ message: error.message }, { status: 400 });
    console.error("[GET /api/payments/fees]", error);
    return NextResponse.json({ message: "Gagal mengambil estimasi biaya." }, { status: 500 });
  }
}
