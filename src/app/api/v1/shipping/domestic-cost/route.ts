// =============================================================
// API: POST /api/v1/shipping/domestic-cost
// Hitung ongkos kirim domestik via RajaOngkir
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { calculateDomesticCost } from "@/lib/rajaongkir";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, weight, courier, price } = body as {
      origin?: number;
      destination?: number;
      weight?: number;
      courier?: string;
      price?: boolean;
    };

    if (
      typeof origin !== "number" ||
      typeof destination !== "number" ||
      typeof weight !== "number" ||
      typeof courier !== "string"
    ) {
      return NextResponse.json(
        { message: "origin, destination, weight, courier wajib diisi dengan benar" },
        { status: 400 }
      );
    }

    const result = await calculateDomesticCost({
      origin,
      destination,
      weight,
      courier,
      price,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[POST /api/v1/shipping/domestic-cost]", error);
    return NextResponse.json(
      { message: error?.message || "Gagal menghitung ongkos kirim" },
      { status: 500 }
    );
  }
}