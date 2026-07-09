// =============================================================
// API Loyalty — /api/loyalty/route.ts
// Menangani CRUD Customer Loyalty Database untuk CMS Admin
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Helper memformat tanggal ramah pengguna
function formatFriendlyDate(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0 && now.getDate() === date.getDate()) {
    return `Today, ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== date.getDate())) {
    return `Yesterday, ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
}

// ─── GET: Ambil Daftar Customer (Loyalty Hub) ─────────────────
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Jika dipanggil GET detail per ID
    if (id) {
      const customer = await prisma.customer.findUnique({
        where: { id },
      });
      if (!customer) {
        return NextResponse.json({ message: "Customer tidak ditemukan" }, { status: 404 });
      }
      return NextResponse.json({
        id: customer.id,
        memberId: `LOY-${customer.id.slice(-4).toUpperCase()}`,
        name: customer.name,
        phone: customer.phone,
        points: customer.points,
        lastTransaction: formatFriendlyDate(customer.updatedAt),
      });
    }

    // Pagination & Search
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);
    const skip = (page - 1) * limit;
    
    const search = searchParams.get("search") ?? "";
    const filter = searchParams.get("filter") ?? "All Members";

    // Build query where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (filter === "Has Points") {
      where.points = { gt: 0 };
    } else if (filter === "Zero Points") {
      where.points = 0;
    }

    // Query ke database
    const [customers, totalItems] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.customer.count({ where }),
    ]);

    // Format data ke interface LoyaltyMember frontend
    const members = customers.map((c) => ({
      id: c.id,
      memberId: `LOY-${c.id.slice(-4).toUpperCase()}`,
      name: c.name,
      phone: c.phone,
      points: c.points,
      lastTransaction: formatFriendlyDate(c.updatedAt),
    }));

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      members,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("[GET /api/loyalty]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Buat Customer Baru (Admin Add Member) ─────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, points } = body;

    if (!phone) {
      return NextResponse.json({ message: "Nomor handphone wajib diisi" }, { status: 400 });
    }

    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (cleanPhone.startsWith("8")) cleanPhone = "62" + cleanPhone;
    if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;

    // Cek duplikasi
    const existing = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });
    if (existing) {
      return NextResponse.json({ message: "Nomor handphone sudah terdaftar" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name || `Guest ${cleanPhone}`,
        phone: cleanPhone,
        points: Number(points ?? 0),
      },
    });

    return NextResponse.json({
      message: "Member berhasil ditambahkan",
      member: {
        id: customer.id,
        memberId: `LOY-${customer.id.slice(-4).toUpperCase()}`,
        name: customer.name,
        phone: customer.phone,
        points: customer.points,
        lastTransaction: "Just added",
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/loyalty]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Update Data Customer ──────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID parameter wajib disertakan" }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, points } = body;

    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ message: "Member tidak ditemukan" }, { status: 404 });
    }

    let cleanPhone = phone ? phone.replace(/\D/g, "") : existing.phone;
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (cleanPhone.startsWith("8")) cleanPhone = "62" + cleanPhone;
    if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;

    // Cek duplikasi jika no HP berubah
    if (cleanPhone !== existing.phone) {
      const duplicate = await prisma.customer.findUnique({
        where: { phone: cleanPhone },
      });
      if (duplicate) {
        return NextResponse.json({ message: "Nomor handphone baru sudah digunakan member lain" }, { status: 400 });
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        phone: cleanPhone,
        points: points !== undefined ? Number(points) : existing.points,
      },
    });

    return NextResponse.json({
      message: "Data member berhasil diupdate",
      member: {
        id: updated.id,
        memberId: `LOY-${updated.id.slice(-4).toUpperCase()}`,
        name: updated.name,
        phone: updated.phone,
        points: updated.points,
        lastTransaction: "Just updated",
      },
    });
  } catch (error) {
    console.error("[PUT /api/loyalty]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Hapus Data Customer ───────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID parameter wajib disertakan" }, { status: 400 });
    }

    // Pastikan customer ada
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ message: "Member tidak ditemukan" }, { status: 404 });
    }

    // Hapus customer (tabel relasi order akan mem-null-kan customerId secara otomatis karena setup schema relasi default set null / cascade)
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Member berhasil dihapus dari database" });
  } catch (error) {
    console.error("[DELETE /api/loyalty]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
