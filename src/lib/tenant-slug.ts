import { RESERVED_TENANT_SLUGS } from "./tenant-reserved";

const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 30;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type SlugValidationErrorCode =
  | "slug_invalid"
  | "slug_reserved"
  | "slug_too_short"
  | "slug_too_long";

export class TenantSlugError extends Error {
  constructor(public readonly code: SlugValidationErrorCode) {
    super(code);
    this.name = "TenantSlugError";
  }
}

export function validateTenantSlug(value: string): string {
  const slug = value.trim();

  if (slug.length < MIN_SLUG_LENGTH) {
    throw new TenantSlugError("slug_too_short");
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    throw new TenantSlugError("slug_too_long");
  }
  if (!SLUG_PATTERN.test(slug)) {
    throw new TenantSlugError("slug_invalid");
  }
  if (RESERVED_TENANT_SLUGS.has(slug)) {
    throw new TenantSlugError("slug_reserved");
  }

  return slug;
}

function normalizeBusinessName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

export async function generateTenantSlug(
  businessName: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = normalizeBusinessName(businessName);
  if (!base) {
    throw new TenantSlugError("slug_invalid");
  }

  const candidateBase = base.slice(0, MAX_SLUG_LENGTH);
  for (let suffix = 1; suffix <= 1000; suffix += 1) {
    const suffixText = suffix === 1 ? "" : `-${suffix}`;
    const availableLength = MAX_SLUG_LENGTH - suffixText.length;
    const candidate = `${candidateBase.slice(0, availableLength).replace(/-+$/g, "")}${suffixText}`;

    if (!RESERVED_TENANT_SLUGS.has(candidate) && !(await isTaken(candidate))) {
      return validateTenantSlug(candidate);
    }
  }

  throw new TenantSlugError("slug_invalid");
}
