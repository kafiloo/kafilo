import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET: Ambil data profile toko
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Cari data setting pertama. Jika belum ada, buat otomatis
    let settings = await prisma.storeSetting.findFirst();
    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: { id: "kofilo-store-1", storeName: "Kofilo Craft Coffee" }
      });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[GET /api/settings/profile]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update data profile toko
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { storeName, description, phone, email, instagram, tiktok, logo, banner } = body;

    let settings = await prisma.storeSetting.findFirst();
    
    if (!settings) {
      settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1" } });
    }

    const updatedSettings = await prisma.storeSetting.update({
      where: { id: settings.id },
      data: {
        storeName,
        description,
        phone,
        email,
        instagram,
        tiktok,
        logo,
        banner
      }
    });

    return NextResponse.json({ message: "Profil toko berhasil diperbarui", settings: updatedSettings });
  } catch (error) {
    console.error("[PUT /api/settings/profile]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}