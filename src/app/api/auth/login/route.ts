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

type LegacyUser = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: "OWNER" | "SUPER_ADMIN" | "MANAGER" | "CASHIER";
};

function isMissingAuthColumn(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2022"
  );
}

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

    let user;
    try {
      user = email
        ? await prisma.user.findUnique({ where: { email } })
        : await prisma.user.findUnique({ where: { username } });
    } catch (error) {
      if (!isMissingAuthColumn(error) || email) throw error;
      const legacyUsers = await prisma.$queryRaw<LegacyUser[]>`
        SELECT "id", "name", "username", "password", "role"::text AS "role"
        FROM "users"
        WHERE "username" = ${username}
        LIMIT 1
      `;
      user = legacyUsers[0]
        ? {
            ...legacyUsers[0],
            tenantId: null,
            email: null,
            passwordHash: null,
            emailVerifiedAt: null,
          }
        : null;
    }

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
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : "";

    if (errorCode.startsWith("P")) {
      return NextResponse.json(
        {
          error: {
            code: "database_unavailable",
            message: "Layanan login sedang tidak tersedia. Coba lagi nanti.",
          },
        },
        { status: 503 },
      );
    }

    if (error instanceof Error && error.message.includes("JWT_SECRET")) {
      return NextResponse.json(
        {
          error: {
            code: "auth_configuration_error",
            message: "Layanan login belum dikonfigurasi dengan benar.",
          },
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "login_failed",
          message: "Login tidak dapat diproses. Coba lagi nanti.",
        },
      },
      { status: 500 },
    );
  }
}
