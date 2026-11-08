import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant-repository";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const tenantId = requireTenantId(session.tenantId);

  try {
    let settings = await prisma.storeSetting.findFirst({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1", tenantId } });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[GET /api/settings/receipt]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const tenantId = requireTenantId(session.tenantId);

  try {
    const body = await req.json();
    const { receiptFooter, wifiName, wifiPassword } = body;

    let settings = await prisma.storeSetting.findFirst({ where: { tenantId } });
    
    if (!settings) {
      settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1", tenantId } });
    }

    const updatedSettings = await prisma.storeSetting.update({
      where: { id: settings.id },
      data: {
        receiptFooter: receiptFooter || "Terima kasih atas kunjungannya!",
        wifiName: wifiName || null,
        wifiPassword: wifiPassword || null,
      }
    });

    return NextResponse.json({ message: "Pengaturan struk berhasil disimpan", settings: updatedSettings });
  } catch (error) {
    console.error("[PUT /api/settings/receipt]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}