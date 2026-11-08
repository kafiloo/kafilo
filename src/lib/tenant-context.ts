import { RESERVED_TENANT_SLUGS } from "./tenant-reserved";
import { validateTenantSlug, TenantSlugError } from "./tenant-slug";

export type TenantContext = {
  tenantId: string;
  slug: string;
};

export function extractTenantSlug(pathname: string): string | null {
  const firstSegment = pathname
    .split("/")
    .map((segment) => segment.trim())
    .find((segment) => segment.length > 0);

  if (!firstSegment || RESERVED_TENANT_SLUGS.has(firstSegment)) {
    return null;
  }

  try {
    return validateTenantSlug(decodeURIComponent(firstSegment));
  } catch (error) {
    if (error instanceof TenantSlugError) {
      return null;
    }
    throw error;
  }
}
