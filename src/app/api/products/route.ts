// =============================================================
// API Products — /api/products/route.ts
// GET: List produk | POST: Tambah | PUT: Edit | DELETE: Hapus
// SKU di-generate otomatis dari nama kategori (tidak manual)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// ─── Helper: Generate SKU dari Kategori ─────────────────────
async function generateSku(categoryId: string): Promise<string> {
  // Ambil nama kategori
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { name: true },
  });

  if (!category) throw new Error("Kategori tidak ditemukan");

  // Buat prefix: ambil 3 huruf pertama dari kategori (uppercase)
  const prefix = category.name
    .replace(/[^a-zA-Z0-9]/g, "") // hapus spasi/simbol
    .substring(0, 3)
    .toUpperCase();

  if (!prefix) throw new Error("Nama kategori tidak valid untuk generate SKU");

  // Cari produk terakhir dengan prefix tersebut untuk increment
  const lastProduct = await prisma.product.findFirst({
    where: { sku: { startsWith: prefix } },
    orderBy: { sku: "desc" },
    select: { sku: true },
  });

  let nextNumber = 1;
  if (lastProduct?.sku) {
    // Ambil angka dari akhir SKU (support format COF001 atau COF-001)
    const match = lastProduct.sku.match(/(\d+)$/);
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

// ─── GET: Semua produk beserta jumlah terjual ─────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const onlyAvailable = searchParams.get("available") === "true";

  try {
    // 1. Ambil Produk & Kategorinya (Kategori WAJIB utuh)
    const products = await prisma.product.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(onlyAvailable ? { isAvailable: true } : {}),
      },
      include: { 
        category: { 
          select: { id: true, name: true, isDrink: true } 
        } 
      },
      orderBy: { name: "asc" },
    });

    let productsWithSold = products.map(p => ({ ...p, sold: 0 }));

    try {
      // 2. Ambil hitungan terjual dari tabel KASIR (OrderItem)
      const cashierSoldData = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
      }).catch(() => []); // Cegah error jika tabel kosong

      // 3. Ambil hitungan terjual dari tabel CUSTOMER PWA (PwaOrder)
      const pwaOrders = await prisma.pwaOrder.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { items: true }
      }).catch(() => []); // Cegah error jika tabel kosong

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

      // 4. Gabungkan Data (Tanpa merusak relasi Category)
      productsWithSold = products.map((p) => {
        const cashierItem = cashierSoldData.find((s) => s.productId === p.id);
        const cashierQty = cashierItem?._sum?.quantity || 0;
        const pwaQty = pwaSoldMap[p.id] || 0;

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          sku: p.sku,
          image: p.image,
          isAvailable: p.isAvailable,
          categoryId: p.categoryId,
          category: p.category, // Pastikan kategori dioper utuh!
          sold: cashierQty + pwaQty,
        };
      });

    } catch (aggError) {
      console.warn("Peringatan: Gagal menghitung agregasi kuantitas. Mengembalikan nilai sold: 0.", aggError);
      // Jika error parah terjadi, productsWithSold sudah aman memiliki sold: 0 di awal
    }

    // 5. Kirimkan ke Frontend
    return NextResponse.json({ products: productsWithSold });

  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Tambah produk baru (SUPER_ADMIN only) ─────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, price, image, isAvailable, categoryId } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { message: "Nama, harga, dan kategori wajib diisi" },
        { status: 400 }
      );
    }

    // 🔥 Auto-generate SKU berdasarkan kategori
    const sku = await generateSku(categoryId);

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: Number(price),
        sku,
        image: image || null,
        isAvailable: isAvailable ?? true,
        categoryId,
      },
      include: { category: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/products]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Edit produk (SUPER_ADMIN only) — SKU tetap, tidak bisa diubah manual
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });

    const body = await req.json();
    
    // 🔥 Jika kategori berubah, generate ulang SKU
    let updateData: any = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.image !== undefined && { image: body.image || null }),
      ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
    };

    if (body.categoryId !== undefined) {
      // Cek apakah kategori benar-benar berubah
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        select: { categoryId: true, sku: true },
      });

      if (existingProduct && existingProduct.categoryId !== body.categoryId) {
        // Generate SKU baru jika pindah kategori
        updateData.categoryId = body.categoryId;
        updateData.sku = await generateSku(body.categoryId);
      } else {
        updateData.categoryId = body.categoryId;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[PUT /api/products]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Hapus produk (SUPER_ADMIN only) ─────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/products]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}