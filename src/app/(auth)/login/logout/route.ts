import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 1. Buat dulu instruksi untuk redirect ke halaman login
  const response = NextResponse.redirect(new URL("/login", request.url));

  // 2. Hapus cookie langsung melalui objek response tersebut
  // Catatan: Ganti "token" dengan nama cookie milikmu (misal: "session")
  response.cookies.delete("token");

  // 3. Jalankan response-nya
  return response;
}