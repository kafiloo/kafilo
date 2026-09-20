// =============================================================
// API Auth — /api/auth/login/route.ts
// POST: Login — cek username + password, set session cookie
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Cari user di database
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json(
        { message: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Verifikasi password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Buat session payload
    const sessionUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    };

    // Serialize session — JWT signed
    const sessionValue = await serializeSession(sessionUser);

    // Set response dengan cookie session
    const response = NextResponse.json({
      message: "Login berhasil",
      user: sessionUser,
    });

    // Set cookie with security headers
    response.cookies.set({
      name: "pos_session",
      value: sessionValue,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
