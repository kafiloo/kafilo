// =============================================================
// API Auth -- /api/auth/logout/route.ts
// GET: Logout -- hapus session cookie dan redirect ke /login
// FIX: Gunakan request.url agar redirect ke domain yang aktif
//      (tidak lagi hardcode localhost:3000)
// =============================================================

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Ambil base URL dari request agar bekerja di semua environment
  // (localhost, Vercel preview, production domain)
  const baseUrl = new URL(req.url).origin;

  const response = NextResponse.redirect(new URL("/login", baseUrl));

  // Hapus cookie session POS
  response.cookies.set("pos_session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  return response;
}
