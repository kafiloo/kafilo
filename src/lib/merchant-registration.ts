import { validateTenantSlug } from "./tenant-slug";

export type MerchantRegistrationInput = {
  email: string;
  password: string;
  business_name: string;
  slug: string;
};

export class RegistrationInputError extends Error {
  constructor(
    public readonly code: "invalid_email" | "invalid_password" | "invalid_business_name" | "slug_invalid",
  ) {
    super(code);
    this.name = "RegistrationInputError";
  }
}

export function parseMerchantRegistration(input: unknown): MerchantRegistrationInput {
  if (!input || typeof input !== "object") {
    throw new RegistrationInputError("invalid_email");
  }

  const value = input as Record<string, unknown>;
  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  const password = typeof value.password === "string" ? value.password : "";
  const businessName =
    typeof value.business_name === "string" ? value.business_name.trim() : "";
  const slug = typeof value.slug === "string" ? value.slug.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new RegistrationInputError("invalid_email");
  }
  if (password.length < 8 || password.length > 128) {
    throw new RegistrationInputError("invalid_password");
  }
  if (businessName.length < 2 || businessName.length > 120) {
    throw new RegistrationInputError("invalid_business_name");
  }

  try {
    validateTenantSlug(slug);
  } catch {
    throw new RegistrationInputError("slug_invalid");
  }

  return { email, password, business_name: businessName, slug };
}
