// =============================================================
// API: GET /api/v1/pwa/orders/[orderId]/status
// Public endpoint -- cek status pesanan PWA (untuk polling di FE)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const order = await prisma.pwaOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        tableId: true,
        totalAmount: true,
        createdAt: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[GET /api/v1/pwa/orders/[orderId]/status]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
