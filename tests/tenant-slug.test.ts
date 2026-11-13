import { describe, expect, it } from "vitest";
import {
  generateTenantSlug,
  TenantSlugError,
  validateTenantSlug,
} from "../src/lib/tenant-slug";

describe("tenant slug policy", () => {
  it("accepts valid slugs and rejects reserved words", () => {
    expect(validateTenantSlug("kafilo-coffee")).toBe("kafilo-coffee");
    expect(() => validateTenantSlug("admin")).toThrowError(
      new TenantSlugError("slug_reserved"),
    );
  });

  it("normalizes accents, symbols, and whitespace", async () => {
    await expect(generateTenantSlug("Café ☕ Nusantara", async () => false)).resolves.toBe(
      "cafe-nusantara",
    );
  });

  it("adds a numeric suffix when the base slug is taken", async () => {
    await expect(
      generateTenantSlug(
        "Kafilo Coffee",
        async (slug) => slug === "kafilo-coffee" || slug === "kafilo-coffee-2",
      ),
    ).resolves.toBe("kafilo-coffee-3");
  });

  it("rejects names with no usable slug characters", async () => {
    await expect(generateTenantSlug("☕", async () => false)).rejects.toMatchObject({
      code: "slug_invalid",
    });
  });
});
