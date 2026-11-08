import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  enforceRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { TenantSlugError, validateTenantSlug } from "@/lib/tenant-slug";

export async function GET(request: Request) {
  const rateLimit = await enforceRateLimit(
    request,
    "check-slug",
    Number(process.env.AUTH_CHECK_SLUG_LIMIT || 30),
    60,
  );
  if (rateLimit instanceof Response) {
    return rateLimit;
  }
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const slug = new URL(request.url).searchParams.get("slug")?.trim() || "";
  try {
    validateTenantSlug(slug);
  } catch (error) {
    const code = error instanceof TenantSlugError ? error.code : "slug_invalid";
    return NextResponse.json({ available: false, error: code });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  return NextResponse.json({ available: !tenant });
}
