// =============================================================
// API: GET /api/v1/payment/methods
// Ambil daftar metode pembayaran via Komerce Payment API
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { getPaymentMethods } from "@/lib/komerce-payment";

export async function GET() {
  try {
    const result = await getPaymentMethods();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/v1/payment/methods]", error);
    return NextResponse.json(
      { message: error?.message || "Gagal mengambil metode pembayaran" },
      { status: 500 }
    );
  }
}