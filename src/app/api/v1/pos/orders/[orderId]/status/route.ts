// =============================================================
// API: PATCH /api/v1/pos/orders/[orderId]/status
// Kasir mengubah status pesanan online dari PWA
// Wajib session POS (cookie pos_session)
// Payload: { status: "BEING_PREPARED" | "READY_FOR_PICKUP" | "CANCELLED" }
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PwaOrderStatus } from "@prisma/client";

// Status yang boleh dipilih oleh kasir (PENDING_CONFIRMATION tidak bisa di-set manual)
const ALLOWED_STATUSES: PwaOrderStatus[] = [
  "BEING_PREPARED",
  "READY_FOR_PICKUP",
  "CANCELLED",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // --- Auth ---
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await req.json();
    const { status } = body as { status?: PwaOrderStatus };

    // --- Validasi status ---
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          message: `Status tidak valid. Pilihan: ${ALLOWED_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // --- Cek pesanan ada ---
    const order = await prisma.pwaOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    // --- Guard: pesanan yang sudah selesai / dibatalkan tidak bisa diubah ---
    if (
      order.status === "READY_FOR_PICKUP" ||
      order.status === "CANCELLED"
    ) {
      return NextResponse.json(
        { message: "Pesanan yang sudah selesai atau dibatalkan tidak bisa diubah" },
        { status: 400 }
      );
    }

    // --- Update status ---
    const updated = await prisma.pwaOrder.update({
      where: { id: orderId },
      data: { status },
      select: {
        id: true,
        status: true,
        tableId: true,
        totalAmount: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Status pesanan berhasil diperbarui",
      order: updated,
    });
  } catch (error) {
    console.error("[PATCH /api/v1/pos/orders/[orderId]/status]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
