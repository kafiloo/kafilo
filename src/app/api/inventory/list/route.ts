// =============================================================
// API Inventory List (Lightweight) — /api/inventory/list/route.ts
// GET: Daftar ringan untuk dropdown pemilihan bahan baku
// =============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        currentStock: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[GET /api/inventory/list]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}