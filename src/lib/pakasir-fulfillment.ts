// =============================================================
// lib/pakasir-fulfillment.ts — pemenuhan pesanan PWA (server)
// Dipakai webhook + sinkronisasi status agar konsisten.
// Sandbox TIDAK memicu pemenuhan di production.
// =============================================================

import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

const isProd = () => process.env.NODE_ENV === "production";

/**
 * Sandbox tidak memicu pemenuhan di production secara default (aman).
 * Untuk testing end-to-end di production dengan API key sandbox,
 * set PAKASIR_ALLOW_SANDBOX_FULFILLMENT="true".
 */
const allowSandboxFulfillment = () =>
  process.env.PAKASIR_ALLOW_SANDBOX_FULFILLMENT === "true";

async function deductStockForPwaOrder(orderId: string, tx: Tx): Promise<void> {
  const order = await (tx as PrismaClient).pwaOrder.findUnique({
    where: { id: orderId },
    select: { items: true },
  });
  if (!order) return;
  const items =
    (order.items as Array<{
      productId: string;
      quantity: number;
      isReward?: boolean;
      price?: number;
    }>) || [];
  const paidItems = items.filter((i) => !(i.isReward === true || i.price === 0));
  if (paidItems.length === 0) return;
  const productIds = [...new Set(paidItems.map((i) => i.productId))];
  const recipeItems = await (tx as PrismaClient).recipeItem.findMany({
    where: { productId: { in: productIds } },
  });
  const qtyMap = new Map<string, number>();
  for (const item of paidItems)
    qtyMap.set(item.productId, (qtyMap.get(item.productId) || 0) + item.quantity);
  const deduction = new Map<string, number>();
  for (const recipe of recipeItems) {
    const need = recipe.quantityNeeded * (qtyMap.get(recipe.productId) || 0);
    if (need > 0)
      deduction.set(recipe.inventoryId, (deduction.get(recipe.inventoryId) || 0) + need);
  }
  for (const [inventoryId, qty] of deduction) {
    await (tx as PrismaClient).inventoryItem.update({
      where: { id: inventoryId },
      data: { currentStock: { decrement: qty } },
    });
  }
}

/**
 * Tandai PakasirPayment COMPLETED + penuhi PwaOrder terkait.
 * Idempotent: jika payment sudah COMPLETED, tidak diproses ulang.
 * @returns "already" | "fulfilled" | "completed-no-order"
 */
export async function fulfillPakasirPayment(
  tx: Tx,
  paymentId: string,
  opts: { isSandbox: boolean; completedAt: Date | null }
): Promise<"already" | "fulfilled" | "completed-no-order"> {
  const db = tx as PrismaClient;
  const payment = await db.pakasirPayment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("PakasirPayment tidak ditemukan.");
  if (payment.status === "COMPLETED") return "already";

  await db.pakasirPayment.update({
    where: { id: payment.id },
    data: { status: "COMPLETED", completedAt: opts.completedAt ?? new Date() },
  });

  if (!payment.pwaOrderId) return "completed-no-order";

  // Sandbox tidak boleh memicu pemenuhan di production (kecuali diizinkan
  // eksplisit untuk testing lewat PAKASIR_ALLOW_SANDBOX_FULFILLMENT).
  if (opts.isSandbox && isProd() && !allowSandboxFulfillment()) {
    console.warn(
      "[pakasir] Pembayaran SANDBOX diterima di production: pembayaran ditandai " +
        "COMPLETED tetapi pesanan TIDAK dipenuhi. Gunakan API key production " +
        "Pakasir, atau set PAKASIR_ALLOW_SANDBOX_FULFILLMENT=true bila ini testing."
    );
    return "completed-no-order";
  }

  const pwaOrder = await db.pwaOrder.findUnique({
    where: { id: payment.pwaOrderId },
    select: { id: true, status: true },
  });
  if (!pwaOrder || pwaOrder.status !== "PENDING_CONFIRMATION")
    return "completed-no-order";

  await deductStockForPwaOrder(pwaOrder.id, tx);
  await db.pwaOrder.update({
    where: { id: pwaOrder.id },
    data: { status: "BEING_PREPARED" },
  });
  return "fulfilled";
}
