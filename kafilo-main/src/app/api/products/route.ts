// =============================================================
// API Products — /api/products/route.ts
// GET: List produk (with recipe/ingredients) | POST: Tambah (with BOM) | PUT: Edit (with BOM) | DELETE: Hapus
// SKU di-generate otomatis dari nama kategori (tidak manual)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// ─── Helper: Generate SKU dari Kategori ─────────────────────
async function generateSku(categoryId: string): Promise<string> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { name: true },
  });

  if (!category) throw new Error("Kategori tidak ditemukan");

  const prefix = category.name
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase();

  if (!prefix) throw new Error("Nama kategori tidak valid untuk generate SKU");

  const lastProduct = await prisma.product.findFirst({
    where: { sku: { startsWith: prefix } },
    orderBy: { sku: "desc" },
    select: { sku: true },
  });

  let nextNumber = 1;
  if (lastProduct?.sku) {
    const match = lastProduct.sku.match(/(\d+)$/);
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

// ─── GET: Semua produk (beserta jumlah terjual & resep) ─────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const onlyAvailable = searchParams.get("available") === "true";

  try {
    const products = await prisma.product.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(onlyAvailable ? { isAvailable: true } : {}),
      },
      include: { 
        category: { 
          select: { id: true, name: true, isDrink: true } 
        },
        recipeItems: {
          include: {
            inventory: {
              select: { id: true, name: true, sku: true, unit: true, currentStock: true }
            }
          }
        }
      },
      orderBy: { name: "asc" },
    });

    let productsWithSold = products.map(p => ({
      ...p,
      sold: 0,
      recipeItems: p.recipeItems.map(r => ({
        id: r.id,
        inventoryId: r.inventoryId,
        quantityNeeded: r.quantityNeeded,
        inventory: r.inventory,
      })),
    }));

    try {
      const cashierSoldData = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
      }).catch(() => []);

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

      productsWithSold = productsWithSold.map((p) => {
        const cashierItem = cashierSoldData.find((s) => s.productId === p.id);
        const cashierQty = cashierItem?._sum?.quantity || 0;
        const pwaQty = pwaSoldMap[p.id] || 0;

        return { ...p, sold: cashierQty + pwaQty };
      });

    } catch (aggError) {
      console.warn("Peringatan: Gagal menghitung agregasi kuantitas.", aggError);
    }

    return NextResponse.json({ products: productsWithSold });

  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── Validasi ingredients (cek keberadaan stock_id) ──────────
async function validateIngredients(ingredients: any[]): Promise<string | null> {
  if (!ingredients || !Array.isArray(ingredients)) return null;

  for (const ing of ingredients) {
    if (!ing.inventoryId) {
      return "Setiap bahan baku harus memiliki inventoryId";
    }
    if (!ing.quantityNeeded || ing.quantityNeeded <= 0) {
      return `Takaran untuk bahan ID ${ing.inventoryId} harus lebih dari 0`;
    }

    const exists = await prisma.inventoryItem.findUnique({
      where: { id: ing.inventoryId },
      select: { id: true },
    });

    if (!exists) {
      return `Bahan baku dengan ID ${ing.inventoryId} tidak ditemukan di database`;
    }
  }

  return null;
}

// ─── Helper: Simpan resep (hapus lama + buat baru) ──────────
async function saveRecipe(productId: string, ingredients: any[]) {
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) return;

  // Hapus semua resep lama untuk produk ini
  await prisma.recipeItem.deleteMany({
    where: { productId },
  });

  // Buat resep baru
  await prisma.recipeItem.createMany({
    data: ingredients.map((ing: any) => ({
      inventoryId: ing.inventoryId,
      productId,
      quantityNeeded: Number(ing.quantityNeeded),
    })),
  });
}

// ─── POST: Tambah produk baru ────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, price, image, isAvailable, categoryId, ingredients } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { message: "Nama, harga, dan kategori wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi ingredients jika ada
    const validationError = await validateIngredients(ingredients);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

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

    // Simpan resep jika ada ingredients
    if (ingredients && ingredients.length > 0) {
      await saveRecipe(product.id, ingredients);
    }

    // Ambil data lengkap dengan resep
    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        recipeItems: {
          include: {
            inventory: {
              select: { id: true, name: true, sku: true, unit: true, currentStock: true }
            }
          }
        }
      },
    });

    return NextResponse.json({ product: fullProduct }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/products]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Edit produk ────────────────────────────────────────
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
    
    let updateData: any = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.image !== undefined && { image: body.image || null }),
      ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
    };

    if (body.categoryId !== undefined) {
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        select: { categoryId: true, sku: true },
      });

      if (existingProduct && existingProduct.categoryId !== body.categoryId) {
        updateData.categoryId = body.categoryId;
        updateData.sku = await generateSku(body.categoryId);
      } else {
        updateData.categoryId = body.categoryId;
      }
    }

    // Validasi ingredients jika ada
    if (body.ingredients !== undefined) {
      const validationError = await validateIngredients(body.ingredients);
      if (validationError) {
        return NextResponse.json({ message: validationError }, { status: 400 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    // Update resep jika ingredients disertakan
    if (body.ingredients !== undefined) {
      await saveRecipe(id, body.ingredients);
    }

    // Ambil data lengkap dengan resep
    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        recipeItems: {
          include: {
            inventory: {
              select: { id: true, name: true, sku: true, unit: true, currentStock: true }
            }
          }
        }
      },
    });

    return NextResponse.json({ product: fullProduct });
  } catch (error) {
    console.error("[PUT /api/products]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Hapus produk ────────────────────────────────────
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