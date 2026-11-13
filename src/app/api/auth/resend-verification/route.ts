import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/gmail-verification";
import {
  enforceRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { createVerificationToken } from "@/lib/verification-token";

const RESEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_RESENDS_PER_HOUR = 3;

function response(status = 202) {
  return NextResponse.json(
    { accepted: true, message: "Jika email terdaftar, tautan verifikasi akan dikirim." },
    { status },
  );
}

export async function POST(request: Request) {
  let email = "";
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return response();
  }

  if (!email || email.length > 254) {
    return response();
  }

  const rateLimit = await enforceRateLimit(
    request,
    "resend-verification",
    Number(process.env.AUTH_RESEND_LIMIT || 3),
    3600,
    email,
  );
  if (rateLimit instanceof Response) {
    return rateLimit;
  }
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerifiedAt) {
    return response();
  }

  const windowStart = new Date(Date.now() - RESEND_WINDOW_MS);
  const recentResends = await prisma.emailVerificationToken.count({
    where: {
      userId: user.id,
      createdAt: { gte: windowStart },
      revokedAt: { not: null },
    },
  });
  if (recentResends >= MAX_RESENDS_PER_HOUR) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Terlalu banyak permintaan.", retry_after: 3600 } },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  const verification = createVerificationToken();
  await prisma.$transaction(async (transaction) => {
    await transaction.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await transaction.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: verification.tokenHash,
        expiresAt: verification.expiresAt,
      },
    });
  });

  try {
    await sendVerificationEmail(email, verification.rawToken);
  } catch (error) {
    console.error("[auth.resend-verification]", {
      event: "verification_delivery_failed",
      error: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json(
      { error: { code: "verification_delivery_failed", message: "Email verifikasi gagal dikirim." } },
      { status: 503 },
    );
  }

  return response();
}
