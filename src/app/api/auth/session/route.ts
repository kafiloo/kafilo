import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ authenticated: false, user: null });

  const tenant = session.tenantId
    ? await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { slug: true } })
    : null;
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.id,
      name: session.name,
      username: session.username,
      email: session.email,
      role: session.role,
      tenantId: session.tenantId,
      tenantSlug: tenant?.slug,
    },
  });
}
