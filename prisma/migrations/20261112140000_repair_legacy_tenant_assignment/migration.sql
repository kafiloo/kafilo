-- Reapply the single-store tenant assignment for records created before or
-- after the original backfill migration, including bootstrap seed users.
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

UPDATE "users"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
UPDATE "categories"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
UPDATE "products"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
UPDATE "orders"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
UPDATE "customers"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
UPDATE "pwa_orders"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
UPDATE "pakasir_payments"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
UPDATE "inventory_items"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
UPDATE "recipe_items"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
UPDATE "reward_products"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
UPDATE "StoreSetting"
SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'kafiloo')
WHERE "tenantId" IS NULL;
