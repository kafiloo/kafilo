// =============================================================
// API: POST /api/v1/qrisly/generate-qris
// Generate dynamic QRIS via QRISLY
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { generateQris } from "@/lib/qrisly";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qris_id, amount, output_type, unique_amount } = body as {
      qris_id?: number;
      amount?: number;
      output_type?: "string" | "image";
      unique_amount?: boolean;
    };

    if (typeof qris_id !== "number") {
      return NextResponse.json(
        { message: "qris_id wajib diisi (number)" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount < 1000 || amount > 100000000) {
      return NextResponse.json(
        { message: "amount minimal 1000 dan maksimal 100000000" },
        { status: 400 }
      );
    }

    const result = await generateQris({
      qris_id,
      amount,
      output_type: output_type ?? "string",
      unique_amount: unique_amount ?? true,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[POST /api/v1/qrisly/generate-qris]", error);
    return NextResponse.json(
      { message: error?.message || "Gagal generate QRIS" },
      { status: 500 }
    );
  }
}