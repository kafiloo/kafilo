// =============================================================
// API Users — /api/users/route.ts
// GET: List semua akun | POST: Tambah akun | DELETE: Hapus akun
// Hanya SUPER_ADMIN yang boleh akses (guard di middleware + sini)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// ─── GET: Ambil semua akun ────────────────────────────────────
export async function GET() {
  // TODO: Add Auth check here — verifikasi session & role SUPER_ADMIN
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      // 🔥 PERUBAHAN 1: Menghapus filter 'CASHIER' agar semua role (Manager/Admin) muncul
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        // password TIDAK dikembalikan ke client
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Tambah akun baru ───────────────────────────────────
export async function POST(req: NextRequest) {
  // TODO: Add Auth check here
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    // 🔥 PERUBAHAN 2: Menangkap data 'role' yang dikirim dari form frontend
    const { name, username, password, role } = body;

    // Validasi input
    if (!name || !username || !password) {
      return NextResponse.json(
        { message: "Nama, username, dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Cek username sudah dipakai
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { message: "Username sudah digunakan" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 PERUBAHAN 3: Validasi role (hanya boleh MANAGER atau CASHIER)
    const validRole = role === "MANAGER" ? "MANAGER" : "CASHIER";

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: validRole as any, // Simpan role yang dipilih ke database
      },
      select: { id: true, name: true, username: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/users]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Hapus akun berdasarkan ID ────────────────────────
export async function DELETE(req: NextRequest) {
  // TODO: Add Auth check here
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID user wajib diisi" }, { status: 400 });
    }

    // Pastikan target bukan SUPER_ADMIN
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
    }
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Tidak bisa menghapus akun Super Admin" },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id } });

    // 🔥 PERUBAHAN 4: Ubah pesan menjadi lebih umum
    return NextResponse.json({ message: "Akun berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/users]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}