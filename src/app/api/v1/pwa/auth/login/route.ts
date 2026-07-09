// =============================================================
// API: POST /api/v1/pwa/auth/login
// Autentikasi pelanggan PWA via nomor HP & Nama
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signPwaToken } from "@/lib/pwa-jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name } = body as { phone?: string; name?: string };

    // --- Validasi Input ---
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { message: "Nomor HP wajib diisi" },
        { status: 400 }
      );
    }

    // Sanitasi: hanya angka
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 14) {
      return NextResponse.json(
        { message: "Nomor HP tidak valid (min 10, max 14 angka)" },
        { status: 400 }
      );
    }

    // Normalisasi prefix Indonesia agar konsisten dengan POS
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith("8")) {
      cleanPhone = "62" + cleanPhone;
    }
    if (!cleanPhone.startsWith("62")) {
      cleanPhone = "62" + cleanPhone;
    }

    // --- Cek atau buat Customer ---
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      // Validasi tambahan untuk member baru: Harus punya nama
      if (!name || name.trim() === "") {
        return NextResponse.json(
          { message: "Nama lengkap wajib diisi untuk pendaftaran awal" },
          { status: 400 }
        );
      }

      // Auto-register: buat customer baru dengan nama yang diinput
      customer = await prisma.customer.create({
        data: {
          phone: cleanPhone,
          name: name.trim(),
          points: 0,
        },
      });
    } else {
      // 🔥 FIX MASALAH 2: Update nama jika sebelumnya dibuat dari POS (tanpa nama) 🔥
      if (name && name.trim() !== "") {
        if (customer.name === "-" || customer.name === "" || customer.name.toLowerCase().includes("guest")) {
          customer = await prisma.customer.update({
            where: { id: customer.id },
            data: { name: name.trim() },
          });
        }
      }
    }

    // --- Sign JWT ---
    const token = await signPwaToken({
      sub: customer.id,
      phone: customer.phone,
      name: customer.name,
    });

    return NextResponse.json({
      message: "Login berhasil",
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        points: customer.points,
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/pwa/auth/login]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}