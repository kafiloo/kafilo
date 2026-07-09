// =============================================================
// API Reward Products — /api/loyalty/rewards/route.ts
// CRUD Menu Penukaran Poin Loyalty
// Code di-generate otomatis dengan format RWD-001
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// ─── Helper: Generate Code Reward ──────────────────────────
const REWARD_PREFIX = "RWD";

async function generateCode(): Promise<string> {
  const lastReward = await prisma.rewardProduct.findFirst({
    where: { code: { startsWith: REWARD_PREFIX } },
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
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
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
      where,
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
  try {
    const body = await req.json();
    const { name, pointCost, qtyExchange } = body;
    
    if (!name || pointCost === undefined) {
      return NextResponse.json({ message: "Nama dan point cost wajib diisi" }, { status: 400 });
    }
    
    // 🔥 Auto-generate code RWD-001 format
    const code = await generateCode();
    
    const reward = await prisma.rewardProduct.create({
      data: { 
        name, 
        code,
        pointCost: Number(pointCost), 
        qtyExchange: qtyExchange ? Number(qtyExchange) : 1 
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
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });
    const body = await req.json();
    const existing = await prisma.rewardProduct.findUnique({ where: { id } });
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
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID wajib diisi" }, { status: 400 });
    const existing = await prisma.rewardProduct.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "Reward tidak ditemukan" }, { status: 404 });
    await prisma.rewardProduct.delete({ where: { id } });
    return NextResponse.json({ message: "Reward berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/loyalty/rewards]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}