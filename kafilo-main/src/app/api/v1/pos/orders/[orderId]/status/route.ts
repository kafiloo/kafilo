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

    // --- Update status + kurangi stock dalam transaction ---
    const updated = await prisma.$transaction(async (tx) => {
      // --- Cek pesanan ada ---
      const order = await tx.pwaOrder.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("NOT_FOUND");
      }

      // --- Guard: pesanan yang sudah selesai / dibatalkan tidak bisa diubah ---
      if (
        order.status === "READY_FOR_PICKUP" ||
        order.status === "CANCELLED"
      ) {
        throw new Error("ALREADY_FINALIZED");
      }

      // 🔥 KURANGI STOCK SAAT KASIR MENGKONFIRMASI PESANAN (status → BEING_PREPARED) 🔥
      if (status === "BEING_PREPARED" && order.status === "PENDING_CONFIRMATION") {
        const items = order.items as Array<{
          productId: string;
          quantity: number;
          isReward?: boolean;
          price?: number;
          name?: string;
        }> || [];

        // Filter hanya produk berbayar (bukan reward)
        const paidItems = items.filter(
          (item) => !(item.isReward === true || item.price === 0)
        );

        if (paidItems.length > 0) {
          const productIds = paidItems.map((item) => item.productId);
          const recipeItems = await tx.recipeItem.findMany({
            where: { productId: { in: [...new Set(productIds)] } },
            include: { inventory: { select: { id: true, currentStock: true } } },
          });

          // Kelompokkan quantity per product
          const productQtyMap = new Map<string, number>();
          paidItems.forEach((item) => {
            productQtyMap.set(
              item.productId,
              (productQtyMap.get(item.productId) || 0) + item.quantity
            );
          });

          // Hitung total pengurangan per inventory item
          const stockDeduction = new Map<string, number>();
          for (const recipe of recipeItems) {
            const qtySold = productQtyMap.get(recipe.productId) || 0;
            const totalNeeded = recipe.quantityNeeded * qtySold;
            if (totalNeeded > 0) {
              stockDeduction.set(
                recipe.inventoryId,
                (stockDeduction.get(recipe.inventoryId) || 0) + totalNeeded
              );
            }
          }

          // Eksekusi pengurangan stock
          for (const [inventoryId, deductQty] of stockDeduction) {
            await tx.inventoryItem.update({
              where: { id: inventoryId },
              data: { currentStock: { decrement: deductQty } },
            });
          }
        }
      }

      // --- Update status ---
      return await tx.pwaOrder.update({
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
    });

    return NextResponse.json({
      message: "Status pesanan berhasil diperbarui",
      order: updated,
    });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }
    if (error?.message === "ALREADY_FINALIZED") {
      return NextResponse.json(
        { message: "Pesanan yang sudah selesai atau dibatalkan tidak bisa diubah" },
        { status: 400 }
      );
    }
    console.error("[PATCH /api/v1/pos/orders/[orderId]/status]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
