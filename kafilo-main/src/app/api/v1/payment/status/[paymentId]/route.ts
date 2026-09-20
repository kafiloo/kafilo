// =============================================================
// API: GET /api/v1/payment/status/[paymentId]
// Cek status pembayaran via Komerce Payment API
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/komerce-payment";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const result = await getPaymentStatus(paymentId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/v1/payment/status/:paymentId]", error);
    return NextResponse.json(
      { message: error?.message || "Gagal mengambil status pembayaran" },
      { status: 500 }
    );
  }
}