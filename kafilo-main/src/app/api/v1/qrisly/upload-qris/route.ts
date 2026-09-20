// =============================================================
// API: POST /api/v1/qrisly/upload-qris
// Upload QRIS image ke QRISLY
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { uploadQris } from "@/lib/qrisly";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const qrisImage = formData.get("qris_image") as File | null;

    if (!name || !qrisImage) {
      return NextResponse.json(
        { message: "name dan qris_image wajib diisi" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { message: "name maksimal 100 karakter" },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(qrisImage.type)) {
      return NextResponse.json(
        { message: "Format file harus PNG atau JPG" },
        { status: 400 }
      );
    }

    // Validasi ukuran file 5MB
    if (qrisImage.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "Ukuran file maksimal 5MB" },
        { status: 400 }
      );
    }

    const result = await uploadQris(formData);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[POST /api/v1/qrisly/upload-qris]", error);
    return NextResponse.json(
      { message: error?.message || "Gagal upload QRIS" },
      { status: 500 }
    );
  }
}