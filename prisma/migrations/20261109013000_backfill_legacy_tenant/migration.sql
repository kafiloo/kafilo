-- Assign existing single-store data to the initial tenant.
-- This preserves legacy POS data while enforcing tenant context for admin APIs.

INSERT INTO "tenants" ("id", "name", "slug", "status", "createdAt", "updatedAt")
VALUES (
  'legacy-kafiloo',
  'Kafiloo',
  'kafiloo',
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "users" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
UPDATE "categories" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
UPDATE "products" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
UPDATE "orders" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
UPDATE "customers" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
UPDATE "pwa_orders" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
UPDATE "pakasir_payments" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
UPDATE "inventory_items" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
UPDATE "recipe_items" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
UPDATE "reward_products" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
UPDATE "StoreSetting" SET "tenantId" = 'legacy-kafiloo' WHERE "tenantId" IS NULL;
