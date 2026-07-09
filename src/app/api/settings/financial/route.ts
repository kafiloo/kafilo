import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    let settings = await prisma.storeSetting.findFirst();
    if (!settings) {
      settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1" } });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[GET /api/settings/financial]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { taxRate, serviceCharge, acceptCash, acceptQris, acceptTransfer } = body;

    let settings = await prisma.storeSetting.findFirst();
    if (!settings) {
      settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1" } });
    }

    const updatedSettings = await prisma.storeSetting.update({
      where: { id: settings.id },
      data: {
        // Simpan nilai menjadi angka pecahan/desimal yang valid
        taxRate: parseFloat(taxRate) || 0,
        serviceCharge: parseFloat(serviceCharge) || 0,
        acceptCash: Boolean(acceptCash),
        acceptQris: Boolean(acceptQris),
        acceptTransfer: Boolean(acceptTransfer),
      }
    });

    return NextResponse.json({ message: "Pengaturan finance berhasil disimpan", settings: updatedSettings });
  } catch (error) {
    console.error("[PUT /api/settings/financial]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}