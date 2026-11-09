// =============================================================
// API Reward Products — /api/loyalty/rewards/route.ts
// CRUD Menu Penukaran Poin Loyalty
// Code di-generate otomatis dengan format RWD-001
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant-repository";

export const dynamic = 'force-dynamic';

// ─── Helper: Generate Code Reward ──────────────────────────
const REWARD_PREFIX = "RWD";

async function generateCode(tenantId: string): Promise<string> {
  const lastReward = await prisma.rewardProduct.findFirst({
    where: { code: { startsWith: REWARD_PREFIX }, tenantId },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let nextNumber = 1;
  if (lastReward?.code) {
    const match = lastReward.code.match(/(\d+)$/);
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
    }
  }

  return `${REWARD_PREFIX}-${String(nextNumber).padStart(3, "0")}`;
}

// ─── GET: Ambil semua reward products ────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
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
    const dummyRewards = [
      { id: "rew-dummy-1", name: "Voucher Diskon 10%", code: "RWD-001", pointCost: 100, qtyExchange: 5 },
      { id: "rew-dummy-2", name: "Kopi Gratis", code: "RWD-002", pointCost: 50, qtyExchange: 10 },
      { id: "rew-dummy-3", name: "Voucher Makan Gratis", code: "RWD-003", pointCost: 200, qtyExchange: 2 },
    ];
    return NextResponse.json({ rewards: dummyRewards });
  }

  try {
    const search = searchParams.get("search") ?? "";
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const rewards = await prisma.rewardProduct.findMany({
      where: { ...where, tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ rewards });
  } catch (error) {
    console.error("[GET /api/loyalty/rewards]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Buat reward product baru ──────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  let tenantId: string;
  try {
    tenantId = requireTenantId(session.tenantId);
  } catch {
    return NextResponse.json({ message: "Tenant context required" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { name, pointCost, qtyExchange } = body;
    
    if (!name || pointCost === undefined) {
      return NextResponse.json({ message: "Nama dan point cost wajib diisi" }, { status: 400 });
    }
    
    // 🔥 Auto-generate code RWD-001 format
    const code = await generateCode(tenantId);
    
    const reward = await prisma.rewardProduct.create({
      data: { 
        name, 
        code,
        pointCost: Number(pointCost), 
        qtyExchange: qtyExchange ? Number(qtyExchange) : 1,
        tenantId,
      },
    });
    
    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/loyalty/rewards]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Update reward product ───────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  let tenantId: string;
  try {
    tenantId = requireTenantId(session.tenantId);
  } catch {
    return NextResponse.json({ message: "Tenant context required" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });
    const body = await req.json();
    const existing = await prisma.rewardProduct.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ message: "Reward tidak ditemukan" }, { status: 404 });
    
    const reward = await prisma.rewardProduct.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        // Code tetap tidak berubah saat edit
        ...(body.pointCost !== undefined && { pointCost: Number(body.pointCost) }),
        ...(body.qtyExchange !== undefined && { qtyExchange: Number(body.qtyExchange) }),
      },
    });
    return NextResponse.json({ reward });
  } catch (error) {
    console.error("[PUT /api/loyalty/rewards]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Hapus reward product ────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  let tenantId: string;
  try {
    tenantId = requireTenantId(session.tenantId);
  } catch {
    return NextResponse.json({ message: "Tenant context required" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });
    const existing = await prisma.rewardProduct.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ message: "Reward tidak ditemukan" }, { status: 404 });
    await prisma.rewardProduct.delete({ where: { id } });
    return NextResponse.json({ message: "Reward berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/loyalty/rewards]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}