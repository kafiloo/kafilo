import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.storeSetting.findFirst({
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
        pwaBanners: null as any,
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
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}