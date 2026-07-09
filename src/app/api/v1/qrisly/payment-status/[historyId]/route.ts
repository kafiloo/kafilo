// =============================================================
// API: GET /api/v1/qrisly/payment-status/[historyId]
// Cek status pembayaran QRIS via QRISLY
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { getQrisPaymentStatus } from "@/lib/qrisly";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ historyId: string }> }
) {
  try {
    const { historyId } = await params;
    const id = Number(historyId);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: "historyId harus berupa angka" },
        { status: 400 }
      );
    }

    const result = await getQrisPaymentStatus(id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/v1/qrisly/payment-status/:historyId]", error);
    return NextResponse.json(
      { message: error?.message || "Gagal mengambil status QRIS" },
      { status: 500 }
    );
  }
}