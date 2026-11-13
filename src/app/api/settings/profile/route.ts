import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant-repository";

export const dynamic = 'force-dynamic';

// GET: Ambil data profile toko
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
      "kafiloo";
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
    // Dummy data untuk development / preview tanpa tenant
    return NextResponse.json({
      settings: {
        id: "kofilo-store-1",
        storeName: "Kafiloo Craft Coffee",
        description: "Specialty Coffee & Modern Indonesian",
        phone: null,
        email: null,
        instagram: null,
        tiktok: null,
        logo: null,
        banner: null,
        address: null,
        mapsUrl: null,
        operatingHours: null,
        isStoreOpen: true,
        taxRate: 0,
        serviceCharge: 0,
        minOrderAmount: 0,
        acceptCash: true,
        acceptQris: true,
        acceptTransfer: false,
        loyaltyEnabled: true,
        rewardPerAmount: 10000,
        pointsEarned: 1,
        registrationPoints: 0,
        pointsExpiryDays: 365,
        receiptFooter: "Terima kasih atas kunjungannya!",
        wifiName: null,
        wifiPassword: null,
        pwaBanners: [],
        pwaEnableTakeaway: true,
        openTime: "09:00",
        closeTime: "00:00",
        storeMode: "AUTO",
        updatedAt: new Date().toISOString(),
        tenantId: "dummy-tenant",
      },
    });
  }

  try {
    // Cari data setting pertama. Jika belum ada, buat otomatis
    let settings = await prisma.storeSetting.findFirst({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: { id: "kofilo-store-1", storeName: "Kofilo Craft Coffee", tenantId }
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
  const tenantId = requireTenantId(session.tenantId);

  try {
    const body = await req.json();
    const { storeName, description, phone, email, instagram, tiktok, logo, banner } = body;

    let settings = await prisma.storeSetting.findFirst({ where: { tenantId } });
    
    if (!settings) {
      settings = await prisma.storeSetting.create({ data: { id: "kofilo-store-1", tenantId } });
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