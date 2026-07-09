// =============================================================
// API: GET /api/v1/pwa/menus
// Public endpoint -- tidak perlu autentikasi
// Return: menu dikelompokkan per kategori, sudah diurutkan sesuai Superadmin!
// =============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Ambil kategori sesuai urutan Drag & Drop di Superadmin (sortOrder)
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" }
    });

    // 2. Ambil semua produk yang tersedia
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      include: { category: { select: { id: true, name: true, isDrink: true } } }
    });

    // 🔥 3. AMBIL DATA PENJUALAN UNTUK BEST SELLER 🔥
    // A. Hitung penjualan dari Kasir (POS)
    const cashierSoldData = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
    }).catch(() => []); 

    // B. Hitung penjualan dari Customer (PWA)
    const pwaOrders = await prisma.pwaOrder.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { items: true }
    }).catch(() => []);

    const pwaSoldMap: Record<string, number> = {};
    pwaOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item && item.productId && typeof item.quantity === 'number') {
            pwaSoldMap[item.productId] = (pwaSoldMap[item.productId] || 0) + item.quantity;
          }
        });
      }
    });

    // 4. Masukkan produk ke dalam "ember" kategorinya masing-masing secara berurutan
    const result = categories.map(cat => {
      const items = products
        .filter(p => p.categoryId === cat.id)
        .map(p => {
          // 🔥 Kalkulasi total terjual (Kasir + PWA)
          const cashierQty = cashierSoldData.find((s) => s.productId === p.id)?._sum?.quantity || 0;
          const pwaQty = pwaSoldMap[p.id] || 0;
          const totalSold = cashierQty + pwaQty;

          return {
            id: p.id, 
            name: p.name, 
            description: p.description, 
            price: p.price, 
            image: p.image, 
            sku: p.sku,
            isAvailable: p.isAvailable, 
            categoryId: p.categoryId, 
            categoryName: cat.name, 
            isDrink: cat.isDrink,
            sold: totalSold // 🔥 Kirim data penjualan ke PWA
          };
        });
      
      return { categoryName: cat.name, items };
    }).filter(cat => cat.items.length > 0); // Buang kategori yang kosong (tidak ada produknya)

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error("[GET /api/v1/pwa/menus]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}