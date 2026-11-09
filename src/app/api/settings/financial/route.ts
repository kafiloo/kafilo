import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant-repository";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  let tenantId: string | null = null;

  if (session?.tenantId) {
    tenantId = session.tenantId;
  } else {
    const slug =
      searchParams.get("tenant") ||
      searchParams.get("slug") ||
      process.env.DEFAULT_TENANT_SLUG ||
      "legacy-kafiloo";
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (tenant) tenantId = tenant.id;
    } catch {
      // tenant lookup gagal, tenantId tetap null
    }
  }

  if (!tenantId) {
    return NextResponse.json({ settings: null });
  }

  try {
    let settings = await prisma.storeSetting.findFirst({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1", tenantId } });
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
  const tenantId = requireTenantId(session.tenantId);

  try {
    const body = await req.json();
    const { taxRate, serviceCharge, acceptCash, acceptQris, acceptTransfer } = body;

    let settings = await prisma.storeSetting.findFirst({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1", tenantId } });
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