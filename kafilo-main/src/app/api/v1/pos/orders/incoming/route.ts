// =============================================================
// API: GET /api/v1/pos/orders/incoming
// Kasir menarik daftar pesanan online yang masuk dari PWA
// Wajib session POS (cookie pos_session)
// Return: PwaOrder dengan status PENDING_CONFIRMATION & BEING_PREPARED
// =============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    // --- Auth: wajib kasir yang login ---
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil pesanan yang masih aktif (belum selesai / dibatalkan)
    const orders = await prisma.pwaOrder.findMany({
      where: {
        status: {
          in: ["PENDING_CONFIRMATION", "BEING_PREPARED"],
        },
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: "asc" }, // yang paling lama masuk didahulukan
    });

    return NextResponse.json({ orders, total: orders.length });
  } catch (error) {
    console.error("[GET /api/v1/pos/orders/incoming]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
