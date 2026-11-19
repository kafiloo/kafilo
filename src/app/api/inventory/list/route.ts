// =============================================================
// API Inventory List (Lightweight) — /api/inventory/list/route.ts
// GET: Daftar ringan untuk dropdown pemilihan bahan baku
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant-repository";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  let tenantId: string;
  try {
    tenantId = requireTenantId(session.tenantId);
  } catch {
    return NextResponse.json({ message: "Tenant context required" }, { status: 403 });
  }

  try {
    const items = await prisma.inventoryItem.findMany({
      where: { tenantId },
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