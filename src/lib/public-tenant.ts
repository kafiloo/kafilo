import { prisma } from "@/lib/prisma";
import { validateTenantSlug } from "@/lib/tenant-slug";

export async function resolvePublicTenant(request: Request) {
  const url = new URL(request.url);
  const rawSlug =
    url.searchParams.get("tenant") ||
    url.searchParams.get("slug") ||
    request.headers.get("x-tenant-slug") ||
    process.env.DEFAULT_TENANT_SLUG ||
    "";

  try {
    const slug = validateTenantSlug(rawSlug);
    return prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
  } catch {
    return null;
  }
}
