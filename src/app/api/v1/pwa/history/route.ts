import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyPwaToken } from "@/lib/pwa-jwt";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Cek Token Autentikasi Pelanggan
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyPwaToken(token);
    } catch (e) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    if (!payload.sub) {
      return NextResponse.json({ message: "Customer ID not found" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: payload.sub },
      select: { tenantId: true },
    });
    if (!customer?.tenantId) {
      return NextResponse.json({ message: "Customer tenant context not found" }, { status: 403 });
    }

    // 2. Tarik Semua PwaOrder milik Customer ini dalam tenant yang sama
    const orders = await prisma.pwaOrder.findMany({
      where: { customerId: payload.sub, tenantId: customer.tenantId },
      orderBy: { createdAt: 'desc' }, // Urutkan dari yang paling baru
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/v1/pwa/history]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}