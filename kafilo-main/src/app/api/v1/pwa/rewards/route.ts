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
    const { productId, pointsCost } = body;

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: decoded.sub } });
      
      if (!customer) throw new Error("Sesi tidak valid atau Pelanggan tidak ditemukan. Silakan Logout dan Login ulang.");
      if (customer.points < pointsCost) throw new Error("Poin tidak cukup");

      // 🔥 LOGIKA BARU: Cek stok reward dari database secara real-time
      const reward = await tx.rewardProduct.findUnique({ where: { id: productId } });
      if (!reward) throw new Error("Reward tidak ditemukan");
      if (reward.qtyExchange <= 0) throw new Error("Kuota reward sudah habis");

      // 🔥 LOGIKA BARU: Kurangi qtyExchange sebanyak 1
      await tx.rewardProduct.update({
        where: { id: productId },
        data: { qtyExchange: { decrement: 1 } }
      });

      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: { points: { decrement: pointsCost } } 
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