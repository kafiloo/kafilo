import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseMerchantRegistration,
  RegistrationInputError,
} from "@/lib/merchant-registration";
import { createVerificationToken } from "@/lib/verification-token";

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>,
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export async function POST(request: Request) {
  let input;
  try {
    input = parseMerchantRegistration(await request.json());
  } catch (error) {
    if (error instanceof RegistrationInputError) {
      return errorResponse(422, error.code, "Data registrasi tidak valid.");
    }
    return errorResponse(400, "invalid_json", "Format request tidak valid.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const verification = createVerificationToken();
  const username = `owner-${randomUUID()}`;

  try {
    const tenant = await prisma.$transaction(async (transaction) => {
      const createdTenant = await transaction.tenant.create({
        data: { name: input.business_name, slug: input.slug },
      });

      await transaction.user.create({
        data: {
          name: input.business_name,
          username,
          password: passwordHash,
          tenantId: createdTenant.id,
          email: input.email,
          passwordHash,
          role: "OWNER",
          verificationTokens: {
            create: {
              tokenHash: verification.tokenHash,
              expiresAt: verification.expiresAt,
            },
          },
        },
      });

      return createdTenant;
    });

    return NextResponse.json(
      {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[auth.register]", {
      event: "merchant_registration_failed",
      error_code: "registration_failed",
      error: error instanceof Error ? error.name : "unknown",
    });
    const isConflict =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002";
    return errorResponse(
      isConflict ? 409 : 500,
      isConflict ? "registration_conflict" : "registration_failed",
      "Registrasi tidak dapat diproses.",
    );
  }
}
