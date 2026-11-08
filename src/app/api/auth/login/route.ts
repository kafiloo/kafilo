// =============================================================
// API Auth — /api/auth/login/route.ts
// POST: Login — cek username + password, set session cookie
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeSession } from "@/lib/auth";
import {
  enforceRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if ((!username && !email) || !password) {
      return NextResponse.json(
        { message: "Email/username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const rateLimit = await enforceRateLimit(
      req,
      "login",
      Number(process.env.AUTH_LOGIN_LIMIT || 10),
      60,
      email || username,
    );
    if (rateLimit instanceof Response) {
      return rateLimit;
    }
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    const user = email
      ? await prisma.user.findUnique({ where: { email } })
      : await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json(
        { message: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Verifikasi password
    const isValid = await bcrypt.compare(password, email ? user.passwordHash ?? "" : user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Username atau password salah" },
        { status: 401 }
      );
    }

    if (user.passwordHash && user.email && !user.emailVerifiedAt) {
      return NextResponse.json(
        { error: { code: "email_not_verified", message: "Email belum diverifikasi." } },
        { status: 403 },
      );
    }

    // Buat session payload
    const sessionUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email ?? undefined,
      tenantId: user.tenantId ?? undefined,
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
