// =============================================================
// API Products — /api/products/route.ts
// GET: List produk (with recipe/ingredients) | POST: Tambah (with BOM) | PUT: Edit (with BOM) | DELETE: Hapus
// SKU di-generate otomatis dari nama kategori (tidak manual)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant-repository";

export const dynamic = 'force-dynamic';

// ─── Helper: Generate SKU dari Kategori ─────────────────────
async function generateSku(categoryId: string, tenantId: string): Promise<string> {
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
    where: { sku: { startsWith: prefix }, tenantId },
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
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  let tenantId: string;
  try {
    tenantId = requireTenantId(session.tenantId);
  } catch {
    return NextResponse.json({ message: "Tenant context required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const onlyAvailable = searchParams.get("available") === "true";

  try {
    const products = await prisma.product.findMany({
      where: {
        tenantId,
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
        where: { product: { tenantId } },
        _sum: { quantity: true },
      }).catch(() => []);

      const pwaOrders = await prisma.pwaOrder.findMany({
        where: { status: { not: 'CANCELLED' }, tenantId },
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
async function validateIngredients(ingredients: any[], tenantId: string): Promise<string | null> {
  if (!ingredients || !Array.isArray(ingredients)) return null;

  for (const ing of ingredients) {
    if (!ing.inventoryId) {
      return "Setiap bahan baku harus memiliki inventoryId";
    }
    if (!ing.quantityNeeded || ing.quantityNeeded <= 0) {
      return `Takaran untuk bahan ID ${ing.inventoryId} harus lebih dari 0`;
    }

    const exists = await prisma.inventoryItem.findFirst({
      where: { id: ing.inventoryId, tenantId },
      select: { id: true },
    });

    if (!exists) {
      return `Bahan baku dengan ID ${ing.inventoryId} tidak ditemukan di database`;
    }
  }

  return null;
}

// ─── Helper: Simpan resep (hapus lama + buat baru) ──────────
async function saveRecipe(productId: string, ingredients: any[], tenantId: string) {
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) return;

  // Hapus semua resep lama untuk produk ini
  await prisma.recipeItem.deleteMany({
    where: { productId, tenantId },
  });

  // Buat resep baru
  await prisma.recipeItem.createMany({
    data: ingredients.map((ing: any) => ({
      inventoryId: ing.inventoryId,
      productId,
      tenantId,
      quantityNeeded: Number(ing.quantityNeeded),
    })),
  });
}

// ─── POST: Tambah produk baru ────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "OWNER", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  let tenantId: string;
  try {
    tenantId = requireTenantId(session.tenantId);
  } catch {
    return NextResponse.json({ message: "Tenant context required" }, { status: 403 });
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

    const category = await prisma.category.findFirst({
      where: { id: categoryId, tenantId },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }

    // Validasi ingredients jika ada
    const validationError = await validateIngredients(ingredients, tenantId);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const sku = await generateSku(categoryId, tenantId);

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: Number(price),
        sku,
        image: image || null,
        isAvailable: isAvailable ?? true,
        categoryId,
        tenantId,
      },
      include: { category: true },
    });

    // Simpan resep jika ada ingredients
    if (ingredients && ingredients.length > 0) {
      await saveRecipe(product.id, ingredients, tenantId);
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
  if (!session || !["SUPER_ADMIN", "OWNER", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  let tenantId: string;
  try {
    tenantId = requireTenantId(session.tenantId);
  } catch {
    return NextResponse.json({ message: "Tenant context required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });

    const body = await req.json();
    
    const updateData: any = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.image !== undefined && { image: body.image || null }),
      ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
    };

    if (body.categoryId !== undefined) {
      const existingProduct = await prisma.product.findFirst({
        where: { id, tenantId },
        select: { categoryId: true, sku: true },
      });
      if (!existingProduct) {
        return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 });
      }

      if (existingProduct.categoryId !== body.categoryId) {
        const category = await prisma.category.findFirst({
          where: { id: body.categoryId, tenantId },
          select: { id: true },
        });
        if (!category) {
          return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
        }
        updateData.categoryId = body.categoryId;
        updateData.sku = await generateSku(body.categoryId, tenantId);
      } else {
        updateData.categoryId = body.categoryId;
      }
    }

    // Validasi ingredients jika ada
    if (body.ingredients !== undefined) {
      const validationError = await validateIngredients(body.ingredients, tenantId);
      if (validationError) {
        return NextResponse.json({ message: validationError }, { status: 400 });
      }
    }

    const updated = await prisma.product.updateMany({
      where: { id, tenantId },
      data: updateData,
    });
    if (updated.count !== 1) {
      return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 });
    }
    // Update resep jika ingredients disertakan
    if (body.ingredients !== undefined) {
      await saveRecipe(id, body.ingredients, tenantId);
    }

    // Ambil data lengkap dengan resep
    const fullProduct = await prisma.product.findFirst({
      where: { id, tenantId },
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
  if (!session || !["SUPER_ADMIN", "OWNER", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  let tenantId: string;
  try {
    tenantId = requireTenantId(session.tenantId);
  } catch {
    return NextResponse.json({ message: "Tenant context required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });

    const deleted = await prisma.product.deleteMany({ where: { id, tenantId } });
    if (deleted.count !== 1) {
      return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/products]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}