import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPwaToken } from "@/lib/pwa-jwt";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    const token = authHeader?.split(" ")[1] || req.cookies.get("pwa_token")?.value;
    
    if (!token) return NextResponse.json({ message: "Unauthorized: Token tidak ada" }, { status: 401 });

    const decoded = await verifyPwaToken(token);
    if (!decoded || !decoded.sub) return NextResponse.json({ message: "Token tidak valid" }, { status: 401 });

    const body = await req.json();
    const { productId } = body;
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ message: "Reward ID tidak valid" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: decoded.sub } });
      
      if (!customer) throw new Error("Sesi tidak valid atau Pelanggan tidak ditemukan. Silakan Logout dan Login ulang.");

      // 🔥 Cek reward milik tenant customer dan stok kuota
      const reward = await tx.rewardProduct.findFirst({
        where: { id: productId, tenantId: customer.tenantId },
      });
      if (!reward) throw new Error("Reward tidak ditemukan");
      if (reward.qtyExchange <= 0) throw new Error("Kuota reward sudah habis");
      if (customer.points < reward.pointCost) throw new Error("Poin tidak cukup");

      // Kurangi qtyExchange sebanyak 1
      await tx.rewardProduct.update({
        where: { id: productId },
        data: { qtyExchange: { decrement: 1 } }
      });

      // Kurangi poin berdasarkan harga poin asli di DB, bukan dari client
      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: { points: { decrement: reward.pointCost } } 
      });
      
      return updatedCustomer;
    });

    return NextResponse.json({ 
      message: "Tukar poin berhasil", 
      customer: { id: result.id, name: result.name, points: result.points } 
    });

  } catch (error: any) {
    console.error("[POST /api/v1/pwa/rewards]", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 400 });
  }
}