import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicTenant } from "@/lib/public-tenant";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tenant = await resolvePublicTenant(request);
    if (!tenant || tenant.status !== "ACTIVE") {
      const url = new URL(request.url);
      const hasTenantSelector =
        url.searchParams.has("tenant") ||
        url.searchParams.has("slug") ||
        request.headers.has("x-tenant-slug") ||
        Boolean(process.env.DEFAULT_TENANT_SLUG);

      if (!hasTenantSelector) {
        return NextResponse.json({
          settings: {
            storeName: "Kafiloo",
            description: null,
            logo: null,
          },
        });
      }

      return NextResponse.json({ message: "Tenant tidak ditemukan" }, { status: 404 });
    }
    let settings = await prisma.storeSetting.findFirst({
      where: { tenantId: tenant.id },
      select: {
        storeName: true,
        description: true,
        logo: true,
        pwaBanners: true,
        storeMode: true,
        openTime: true,
        closeTime: true,
        isStoreOpen: true,
        receiptFooter: true,
        wifiName: true,
        wifiPassword: true,
        taxRate: true,
        serviceCharge: true,
        acceptCash: true,
        acceptQris: true,
        acceptTransfer: true,
      }
    });

    if (!settings) {
      settings = { 
        storeName: "Kafiloo", 
        description: null, 
        logo: null, 
        pwaBanners: null,
        storeMode: "AUTO",   
        openTime: "09:00",   
        closeTime: "00:00",  
        isStoreOpen: true,
        receiptFooter: "Terima kasih atas kunjungannya!",
        wifiName: null,
        wifiPassword: null,
        taxRate: 0,
        serviceCharge: 0,
        acceptCash: true,
        acceptQris: true,
        acceptTransfer: false,
      };
    }

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}