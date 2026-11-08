import { describe, expect, it } from "vitest";
import { extractTenantSlug } from "../src/lib/tenant-context";

describe("tenant path context", () => {
  it("extracts a valid first path segment", () => {
    expect(extractTenantSlug("/kafilo-coffee/menu")).toBe("kafilo-coffee");
  });

  it("does not treat system routes as tenant slugs", () => {
    expect(extractTenantSlug("/api/products")).toBeNull();
    expect(extractTenantSlug("/cms/dashboard")).toBeNull();
  });

  it("rejects malformed or encoded invalid segments", () => {
    expect(extractTenantSlug("/ab/menu")).toBeNull();
    expect(extractTenantSlug("/admin/menu")).toBeNull();
  });
});
