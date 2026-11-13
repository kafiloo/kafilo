-- Additive tenant foundation migration.
-- Legacy POS users remain valid while merchant auth fields are introduced.

ALTER TYPE "Role" ADD VALUE 'OWNER';

CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "users"
    ADD COLUMN "tenantId" TEXT,
    ADD COLUMN "email" TEXT,
    ADD COLUMN "passwordHash" TEXT,
    ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

ALTER TABLE "users"
    ADD CONSTRAINT "users_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rollback procedure for disposable databases:
-- DROP INDEX "users_tenantId_idx";
-- DROP INDEX "users_email_key";
-- DROP INDEX "tenants_slug_key";
-- ALTER TABLE "users" DROP CONSTRAINT "users_tenantId_fkey";
-- ALTER TABLE "users" DROP COLUMN "emailVerifiedAt", DROP COLUMN "passwordHash",
--   DROP COLUMN "email", DROP COLUMN "tenantId";
-- DROP TABLE "tenants";
-- ALTER TYPE "Role" cannot safely remove OWNER in PostgreSQL; restore from a
-- database backup or recreate the enum during a controlled rollback.
