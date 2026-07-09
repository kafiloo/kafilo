// =============================================================
// API POS History — /api/pos/history/route.ts
// GET: Ambil semua transaksi Order (Kasir) & PWA (Pelanggan) hari ini
// =============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // 1. Tarik pesanan offline dari Kasir (Tabel Order)
    const posOrders = await prisma.order.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      include: { cashier: { select: { name: true } } },
    });

    // 2. Tarik pesanan online dari PWA (Tabel PwaOrder)
    const pwaOrders = await prisma.pwaOrder.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      include: { customer: { select: { name: true } } },
    });

    // 3. Format data POS
    const formattedPos = posOrders.map((o: any) => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status,
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod,
      cashierName: o.cashier?.name ?? "-",
      source: "POS",
    }));

    // 4. Format data PWA (Mapping Status & Penamaan)
    const formattedPwa = pwaOrders.map((o: any) => {
      // 🔥 PERBAIKAN: UI Kasir mendeteksi teks 'COMPLETED' untuk warna hijau
      let uiStatus = "PENDING"; 
      if (o.status === "READY_FOR_PICKUP" || o.status === "COMPLETED") {
        uiStatus = "COMPLETED"; // <-- Diganti menjadi COMPLETED agar UI jadi "Sukses"
      } else if (o.status === "CANCELLED") {
        uiStatus = "CANCELLED";
      }

      return {
        id: o.id,
        createdAt: o.createdAt,
        status: uiStatus, 
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod ?? "ONLINE", 
        // Tambahkan label [PWA] agar kasir tidak kebingungan
        cashierName: o.customer?.name ? `[PWA] ${o.customer.name}` : "[PWA] Pelanggan",
        source: "PWA",
      };
    });

    // 5. Gabungkan & Urutkan
    const allOrders = [...formattedPos, ...formattedPwa];
    allOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 6. Final Format ke Frontend
    const finalFormatted = allOrders.map((order, index) => ({
      id: order.id,
      no: allOrders.length - index,
      txId: order.id.slice(-8).toUpperCase(),
      time: order.createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      cashierName: order.cashierName,
      source: order.source,
    }));

    return NextResponse.json({ orders: finalFormatted });
  } catch (error) {
    console.error("[GET /api/pos/history]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}