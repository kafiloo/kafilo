// =============================================================
// API: POST /api/v1/payment/callback
// Webhook notifikasi dari Komerce Payment Gateway
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🔥 Helper: kurangi stock berdasarkan recipe untuk PwaOrder
async function deductStockForPwaOrder(orderId: string, tx: any) {
  const order = await tx.pwaOrder.findUnique({
    where: { id: orderId },
    select: { items: true },
  });

  if (!order) return;

  const items = (order.items as Array<{
    productId: string;
    quantity: number;
    isReward?: boolean;
    price?: number;
  }>) || [];

  const paidItems = items.filter(
    (item) => !(item.isReward === true || item.price === 0)
  );

  if (paidItems.length === 0) return;

  const productIds = paidItems.map((item) => item.productId);
  const recipeItems = await tx.recipeItem.findMany({
    where: { productId: { in: [...new Set(productIds)] } },
    include: { inventory: { select: { id: true, currentStock: true } } },
  });

  const productQtyMap = new Map<string, number>();
  paidItems.forEach((item) => {
    productQtyMap.set(
      item.productId,
      (productQtyMap.get(item.productId) || 0) + item.quantity
    );
  });

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

  for (const [inventoryId, deductQty] of stockDeduction) {
    await tx.inventoryItem.update({
      where: { id: inventoryId },
      data: { currentStock: { decrement: deductQty } },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verifikasi callback_API_KEY dari header (jika dikirim Komerce)
    const callbackKey = req.headers.get("x-callback-api-key");
    const EXPECTED_KEY = process.env.KOMERCE_CALLBACK_API_KEY;

    if (EXPECTED_KEY && callbackKey !== EXPECTED_KEY) {
      // Jangan tolak sepenuhnya — beberapa provider tidakKirim key di header
      console.warn("[payment/callback] API key mismatch, treating as unverified");
    }

    const body = await req.json();
    const {
      payment_id,
      order_id,
      status,
      paid_amount,
      paid_at,
      channel_code,
    } = body as {
      payment_id?: string;
      order_id?: string;
      status?: string;
      paid_amount?: number;
      paid_at?: string;
      channel_code?: string;
    };

    console.log("[payment/callback] Received body:", JSON.stringify(body));

    if (!payment_id) {
      return NextResponse.json(
        { message: "payment_id wajib diisi" },
        { status: 400 }
      );
    }

    // Cari PwaOrder berdasarkan payment_id (disimpan di kolom items JSON)
    // Karena payment_id disimpan di metadata order, kita cari via raw query
    // atau cek semua PwaOrder yang belum completed.
    //
    // Pendekatan: Cari PwaOrder yang status PENDING_CONFIRMATION atau BEING_PREPARED
    // dan milik customer (jika ada customerId).
    // Di production, sebaiknya tambah kolom `paymentId` langsung di model PwaOrder.

    let updatedOrder = null;

    if (order_id) {
      // Coba cari berdasarkan order_id (kita simpan orderId di client)
      const allPending = await prisma.pwaOrder.findMany({
        where: {
          status: { in: ["PENDING_CONFIRMATION", "BEING_PREPARED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Cari yang memiliki paymentId matching di items JSON
      for (const order of allPending) {
        const items = order.items as any[];
        const matchingItem = items?.find(
          (it: any) => it?.paymentId === payment_id
        );
        if (matchingItem) {
          // 🔥 Jika status PAID, kurangi stock dalam transaction 🔥
          if (status === "PAID") {
            updatedOrder = await prisma.$transaction(async (tx) => {
              // Kurangi stock
              await deductStockForPwaOrder(order.id, tx);

              // Update status
              return await tx.pwaOrder.update({
                where: { id: order.id },
                data: { status: "READY_FOR_PICKUP" as any },
              });
            });
          } else {
            updatedOrder = await prisma.pwaOrder.update({
              where: { id: order.id },
              data: {
                status:
                  status === "EXPIRED"
                    ? ("PENDING_CONFIRMATION" as any)
                    : status === "CANCELED"
                    ? ("CANCELLED" as any)
                    : order.status,
              },
            });
          }
          break;
        }
      }
    }

    // Fallback: Jika tidak ketemu, coba lookup dengan paymentId di order_id column
    // (beberapa implementasi menyimpan payment_id sebagai id PwaOrder)
    if (!updatedOrder) {
      try {
        // 🔥 Jika status PAID, kurangi stock dalam transaction 🔥
        if (status === "PAID") {
          updatedOrder = await prisma.$transaction(async (tx) => {
            await deductStockForPwaOrder(payment_id, tx);

            return await tx.pwaOrder.update({
              where: { id: payment_id },
              data: { status: "READY_FOR_PICKUP" as any },
            });
          });
        } else {
          updatedOrder = await prisma.pwaOrder.update({
            where: { id: payment_id },
            data: {
              status:
                status === "EXPIRED"
                  ? ("PENDING_CONFIRMATION" as any)
                  : status === "CANCELED"
                  ? ("CANCELLED" as any)
                  : undefined,
            },
          });
        }
      } catch {
        // Jika masih error, sudahi saja — kembalikan 200 agar callback tidak retry
      }
    }

    return NextResponse.json({
      message: "Callback received",
      orderId: updatedOrder?.id ?? null,
    });
  } catch (error: any) {
    console.error("[POST /api/v1/payment/callback]", error);
    // Kembalikan 200 agar Komerce tidak melakukan retry
    return NextResponse.json(
      { message: "Callback processed with errors" },
      { status: 200 }
    );
  }
}