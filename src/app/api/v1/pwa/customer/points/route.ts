// =============================================================
// API: GET /api/v1/pwa/customer/points
// Ambil data poin terbaru customer yang sedang login
// Wajib Bearer token dari customer
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyPwaToken } from "@/lib/pwa-jwt";

export async function GET(req: NextRequest) {
  // --- Autentikasi ---
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized: Token tidak ditemukan" },
      { status: 401 }
    );
  }

  let customerPayload;
  try {
    customerPayload = await verifyPwaToken(token);
  } catch {
    return NextResponse.json(
      { message: "Unauthorized: Token tidak valid atau sudah expired" },
      { status: 401 }
    );
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerPayload.sub },
      select: {
        id: true,
        phone: true,
        name: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Customer tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("[GET /api/v1/pwa/customer/points]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}