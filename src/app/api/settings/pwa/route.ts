import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant-repository";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  if (!session || session.role !== "SUPER_ADMIN") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
    const settings = await prisma.storeSetting.findFirst({
      where: { tenantId },
      select: { 
        storeMode: true, 
        openTime: true,
        closeTime: true,
        pwaBanners: true, 
      }
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const tenantId = requireTenantId(session.tenantId);

  try {
    const body = await req.json();
    let settings = await prisma.storeSetting.findFirst({ where: { tenantId } });
    if (!settings) settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1", tenantId } });

    await prisma.storeSetting.update({
      where: { id: settings.id },
      data: { 
        storeMode: body.storeMode || "AUTO", 
        openTime: body.openTime || "09:00",
        closeTime: body.closeTime || "00:00",
        pwaBanners: body.pwaBanners || [],
      }
    });

    return NextResponse.json({ message: "PWA Settings updated" });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}