import { describe, expect, it } from "vitest";
import {
  MissingTenantContextError,
  requireTenantId,
  tenantWhere,
} from "../src/lib/tenant-repository";

describe("tenant repository guards", () => {
  it("rejects missing tenant context explicitly", () => {
    expect(() => requireTenantId(undefined)).toThrowError(
      MissingTenantContextError,
    );
    expect(() => tenantWhere(null, { id: "record-1" })).toThrowError(
      "Tenant context is required",
    );
  });

  it("always adds the tenant filter to a query predicate", () => {
    expect(tenantWhere("tenant-a", { id: "record-1" })).toEqual({
      id: "record-1",
      tenantId: "tenant-a",
    });
  });
});
