// =============================================================
// API Categories — /api/categories/route.ts
// GET: List kategori | POST: Tambah | PUT: Edit | DELETE: Hapus
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant-repository";

export const dynamic = 'force-dynamic'; // Hindari cache ganas Next.js

// ─── GET: Ambil semua kategori (Public) ──────────────────────
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  let tenantId: string;
  try {
    tenantId = requireTenantId(session.tenantId);
  } catch {
    return NextResponse.json({ message: "Tenant context required" }, { status: 403 });
  }
  try {
    const categories = await prisma.category.findMany({
      where: { tenantId },
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
    const { name, isDrink } = body;

    if (!name) {
      return NextResponse.json({ message: "Nama kategori wajib diisi" }, { status: 400 });
    }

    // 🔥 UBAHAN: Cari urutan terakhir, lalu tambahkan di posisi paling bawah
    const lastCategory = await prisma.category.findFirst({
      where: { tenantId },
      orderBy: { sortOrder: 'desc' },
    });
    const nextOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;

    const category = await prisma.category.create({
      data: { 
        name, 
        isDrink: isDrink ?? false,
        sortOrder: nextOrder,
        tenantId,
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

    // 🔥 UBAHAN: Tangkap sinyal Reorder massal dari Drag-and-Drop
    if (body.reorder && Array.isArray(body.categories)) {
      const transactions = body.categories.map((cat: any) => 
        prisma.category.updateMany({
          where: { id: cat.id, tenantId },
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
    
    const updated = await prisma.category.updateMany({
      where: { id, tenantId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.isDrink !== undefined && { isDrink: body.isDrink }),
      },
    });
    if (updated.count !== 1) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }
    const category = await prisma.category.findFirst({ where: { id, tenantId } });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("[PUT /api/categories]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Hapus kategori (SUPER_ADMIN only) ───────────────
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

    // 🔥 UBAHAN: Hapus blokade/validasi error manual di sini.
    // Biarkan Prisma yang bekerja merobohkan "rak" dan "buku"-nya via Cascade.

    const deleted = await prisma.category.deleteMany({ where: { id, tenantId } });
    if (deleted.count !== 1) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error: any) {
    console.error("[DELETE /api/categories]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}