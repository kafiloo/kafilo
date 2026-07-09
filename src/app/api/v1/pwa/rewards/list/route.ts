// =============================================================
// API PWA: GET /api/v1/pwa/rewards/list
// Mengambil daftar Reward (Tabel RewardProduct) untuk pelanggan (PWA)
// =============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rewards = await prisma.rewardProduct.findMany({
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