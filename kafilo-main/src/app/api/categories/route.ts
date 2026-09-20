// =============================================================
// API Categories — /api/categories/route.ts
// GET: List kategori | POST: Tambah | PUT: Edit | DELETE: Hapus
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic'; // Hindari cache ganas Next.js

// ─── GET: Ambil semua kategori (Public) ──────────────────────
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" }, // 🔥 UBAHAN: Sekarang diurutkan berdasarkan drag-and-drop
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Tambah kategori baru (SUPER_ADMIN only) ───────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, isDrink } = body;

    if (!name) {
      return NextResponse.json({ message: "Nama kategori wajib diisi" }, { status: 400 });
    }

    // 🔥 UBAHAN: Cari urutan terakhir, lalu tambahkan di posisi paling bawah
    const lastCategory = await prisma.category.findFirst({
      orderBy: { sortOrder: 'desc' },
    });
    const nextOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;

    const category = await prisma.category.create({
      data: { 
        name, 
        isDrink: isDrink ?? false,
        sortOrder: nextOrder // 🔥 UBAHAN: Simpan urutannya
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/categories]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Edit kategori (SUPER_ADMIN only) ───────────────────
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 🔥 UBAHAN: Tangkap sinyal Reorder massal dari Drag-and-Drop
    if (body.reorder && Array.isArray(body.categories)) {
      const transactions = body.categories.map((cat: any) => 
        prisma.category.update({
          where: { id: cat.id },
          data: { sortOrder: cat.sortOrder }
        })
      );
      await prisma.$transaction(transactions);
      return NextResponse.json({ message: "Urutan berhasil diperbarui" });
    }
    
    // Edit Normal (Nama/Tipe)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });
    
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.isDrink !== undefined && { isDrink: body.isDrink }),
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("[PUT /api/categories]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Hapus kategori (SUPER_ADMIN only) ───────────────
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });

    // 🔥 UBAHAN: Hapus blokade/validasi error manual di sini.
    // Biarkan Prisma yang bekerja merobohkan "rak" dan "buku"-nya via Cascade.

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error: any) {
    console.error("[DELETE /api/categories]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}