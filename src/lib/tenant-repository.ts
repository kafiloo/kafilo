export class MissingTenantContextError extends Error {
  readonly code = "tenant_context_required";

  constructor() {
    super("Tenant context is required for this operation.");
    this.name = "MissingTenantContextError";
  }
}

export function requireTenantId(tenantId: string | null | undefined): string {
  if (!tenantId || tenantId.trim() === "") {
    throw new MissingTenantContextError();
  }

  return tenantId;
}

export function tenantWhere<T extends Record<string, unknown>>(
  tenantId: string | null | undefined,
  where: T = {} as T,
): T & { tenantId: string } {
  return {
    ...where,
    tenantId: requireTenantId(tenantId),
  };
}
