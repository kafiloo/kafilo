// =============================================================
// API POS History Detail — /api/pos/history/[id]/route.ts
// GET: Ambil detail order + order items berdasarkan ID (Mendukung POS & PWA)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 1. Cari di tabel Order (Kasir Offline) terlebih dahulu
    const posOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        cashier: { select: { name: true } },
        orderItems: {
          include: {
            product: {
              select: { name: true, price: true, image: true },
            },
          },
        },
      },
    });

    if (posOrder) {
      return NextResponse.json({
        order: {
          id: posOrder.id,
          txId: posOrder.id.slice(-8).toUpperCase(),
          status: posOrder.status,
          paymentMethod: posOrder.paymentMethod,
          totalAmount: posOrder.totalAmount,
          createdAt: posOrder.createdAt.toISOString(),
          cashierName: posOrder.cashier?.name ?? "-",
          source: "POS",
          items: posOrder.orderItems.map((item) => ({
            id: item.id,
            productName: item.product?.name ?? "Produk dihapus",
            productImage: item.product?.image ?? null,
            quantity: item.quantity,
            subTotal: item.subTotal,
            unitPrice: item.product?.price ?? 0,
          })),
        },
      });
    }

    // 2. Jika tidak ketemu di POS, cari di tabel PwaOrder (Pesanan Online)
    const pwaOrder = await prisma.pwaOrder.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true } },
      },
    });

    if (pwaOrder) {
      // Memetakan status PWA agar sesuai dengan standar UI Kasir
      let uiStatus = "PENDING"; 
      if (pwaOrder.status === "READY_FOR_PICKUP" || pwaOrder.status === "COMPLETED" as any) {
        uiStatus = "COMPLETED"; 
      } else if (pwaOrder.status === "CANCELLED") {
        uiStatus = "CANCELLED";
      }

      // Pastikan items adalah array sebelum di-map
      const itemsArray = Array.isArray(pwaOrder.items) ? pwaOrder.items : [];

      return NextResponse.json({
        order: {
          id: pwaOrder.id,
          txId: pwaOrder.id.slice(-8).toUpperCase(),
          status: uiStatus,
          paymentMethod: pwaOrder.paymentMethod ?? "ONLINE",
          totalAmount: pwaOrder.totalAmount,
          createdAt: pwaOrder.createdAt.toISOString(),
          cashierName: pwaOrder.customer?.name ? `[PWA] ${pwaOrder.customer.name}` : "[PWA] Pelanggan",
          source: "PWA",
          items: itemsArray.map((item: any, index: number) => ({
            id: `pwa-item-${index}`, // PWA items disimpan di JSON, tidak punya ID unik dari DB
            productName: item.name ?? "Produk",
            productImage: null, // PWA order biasanya tidak menyimpan image di JSON
            quantity: item.quantity ?? 1,
            subTotal: item.subTotal ?? (item.price * item.quantity),
            unitPrice: item.price ?? 0,
          })),
        },
      });
    }

    // 3. Jika tidak ada di kedua tabel
    return NextResponse.json({ message: "Order tidak ditemukan" }, { status: 404 });

  } catch (error) {
    console.error("[GET /api/pos/history/[id]]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}