// =============================================================
// API Inventory — /api/inventory/route.ts
// GET: List inventory (with search) | POST: Tambah | PUT: Edit | DELETE: Hapus
// PATCH: Restock (tambah stok)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// ─── Helper: Generate SKU ─────────────────────────────────────
async function generateInventorySku(): Promise<string> {
  const prefix = "INV";
  const lastItem = await prisma.inventoryItem.findFirst({
    where: { sku: { startsWith: prefix } },
    orderBy: { sku: "desc" },
    select: { sku: true },
  });

  let nextNumber = 1;
  if (lastItem?.sku) {
    const match = lastItem.sku.match(/(\d+)$/);
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

// ─── GET: List inventory dengan dukungan pencarian ────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[GET /api/inventory]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Tambah inventory baru ─────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "MANAGER")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, category, unit, currentStock, minThreshold } = body;

    if (!name) {
      return NextResponse.json({ message: "Nama barang wajib diisi" }, { status: 400 });
    }

    const sku = await generateInventorySku();

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        sku,
        category: category || "Umum",
        unit: unit || "PIECE",
        currentStock: currentStock ?? 0,
        minThreshold: minThreshold ?? 0,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/inventory]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Edit inventory ─────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "MANAGER")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });

    const body = await req.json();

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.currentStock !== undefined && { currentStock: Number(body.currentStock) }),
        ...(body.minThreshold !== undefined && { minThreshold: Number(body.minThreshold) }),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[PUT /api/inventory]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH: Restock (tambah stok) ────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "MANAGER")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });

    const body = await req.json();
    const { quantity } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ message: "Jumlah barang masuk harus lebih dari 0" }, { status: 400 });
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Barang tidak ditemukan" }, { status: 404 });
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        currentStock: existing.currentStock + Number(quantity),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[PATCH /api/inventory]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Hapus inventory (dengan proteksi relasi Recipe) ──
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "MANAGER")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });

    // Cek apakah item masih terikat dengan resep menu aktif
    const recipeCount = await prisma.recipeItem.count({
      where: { inventoryId: id },
    });

    if (recipeCount > 0) {
      return NextResponse.json(
        { message: `Item ini masih digunakan di ${recipeCount} resep menu aktif. Hapus resep terlebih dahulu sebelum menghapus bahan baku ini.` },
        { status: 409 }
      );
    }

    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ message: "Item berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/inventory]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}