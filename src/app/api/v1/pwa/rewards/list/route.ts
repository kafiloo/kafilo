// =============================================================
// API PWA: GET /api/v1/pwa/rewards/list
// Mengambil daftar Reward (Tabel RewardProduct) untuk pelanggan (PWA)
// =============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicTenant } from "@/lib/public-tenant";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tenant = await resolvePublicTenant(request);
    if (!tenant || tenant.status !== "ACTIVE") {
      return NextResponse.json({ message: "Tenant tidak ditemukan" }, { status: 404 });
    }
    const rewards = await prisma.rewardProduct.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      // Tarik semua data yang disetting superadmin
      select: {
        id: true,
        name: true,
        code: true,
        pointCost: true,
        qtyExchange: true,
      }
    });

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error("[GET /api/v1/pwa/rewards/list]", error);
    return NextResponse.json({ message: "Gagal memuat reward" }, { status: 500 });
  }
}