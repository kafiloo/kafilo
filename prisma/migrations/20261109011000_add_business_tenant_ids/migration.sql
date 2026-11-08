-- Additive tenant scope columns. Existing rows remain NULL until an explicit
-- tenant backfill mapping is approved and applied.

ALTER TABLE "categories" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "products" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "orders" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "customers" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "pwa_orders" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "pakasir_payments" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "recipe_items" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "reward_products" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "StoreSetting" ADD COLUMN "tenantId" TEXT;

CREATE INDEX "categories_tenantId_idx" ON "categories"("tenantId");
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");
CREATE INDEX "orders_tenantId_idx" ON "orders"("tenantId");
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");
CREATE INDEX "pwa_orders_tenantId_idx" ON "pwa_orders"("tenantId");
CREATE INDEX "pakasir_payments_tenantId_idx" ON "pakasir_payments"("tenantId");
CREATE INDEX "inventory_items_tenantId_idx" ON "inventory_items"("tenantId");
CREATE INDEX "recipe_items_tenantId_idx" ON "recipe_items"("tenantId");
CREATE INDEX "reward_products_tenantId_idx" ON "reward_products"("tenantId");
CREATE INDEX "StoreSetting_tenantId_idx" ON "StoreSetting"("tenantId");

ALTER TABLE "categories" ADD CONSTRAINT "categories_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pwa_orders" ADD CONSTRAINT "pwa_orders_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pakasir_payments" ADD CONSTRAINT "pakasir_payments_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reward_products" ADD CONSTRAINT "reward_products_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreSetting" ADD CONSTRAINT "StoreSetting_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
