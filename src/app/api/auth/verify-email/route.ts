import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenHash, getVerificationFailure } from "@/lib/email-verification";

function failureResponse(code: string, status: number) {
  return NextResponse.json(
    { error: { code, message: "Token verifikasi tidak dapat digunakan." } },
    { status },
  );
}

export async function POST(request: Request) {
  let token: string;
  try {
    const body = await request.json();
    token = typeof body?.token === "string" ? body.token.trim() : "";
  } catch {
    return failureResponse("token_invalid", 400);
  }

  if (!token || token.length > 200) {
    return failureResponse("token_invalid", 400);
  }

  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: getTokenHash(token) },
  });
  const failure = getVerificationFailure(tokenRecord);
  if (failure) {
    return failureResponse(failure, failure === "token_invalid" ? 404 : 410);
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const updated = await transaction.emailVerificationToken.updateMany({
        where: {
          id: tokenRecord!.id,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (updated.count !== 1) {
        throw new Error("verification_token_state_changed");
      }

      await transaction.user.update({
        where: { id: tokenRecord!.userId },
        data: { emailVerifiedAt: new Date() },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "verification_token_state_changed") {
      return failureResponse("token_used", 410);
    }
    console.error("[auth.verify-email]", {
      event: "email_verification_failed",
      error_code: "verification_failed",
      error: error instanceof Error ? error.name : "unknown",
    });
    return failureResponse("verification_failed", 500);
  }

  return NextResponse.json({ verified: true });
}
