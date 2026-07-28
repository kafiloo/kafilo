/*
  Warnings:

  - You are about to drop the column `pwaFooterText` on the `StoreSetting` table. All the data in the column will be lost.
  - You are about to drop the column `pwaWelcomeBg` on the `StoreSetting` table. All the data in the column will be lost.
  - You are about to drop the column `pwaWelcomeSubtitle` on the `StoreSetting` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'PIECE', 'PACK', 'BOX', 'BOTTLE', 'CUP', 'BAG');

-- AlterTable
ALTER TABLE "StoreSetting" DROP COLUMN "pwaFooterText",
DROP COLUMN "pwaWelcomeBg",
DROP COLUMN "pwaWelcomeSubtitle",
ADD COLUMN     "closeTime" TEXT DEFAULT '00:00',
ADD COLUMN     "openTime" TEXT DEFAULT '09:00',
ADD COLUMN     "storeMode" TEXT DEFAULT 'AUTO';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Umum',
    "unit" "UnitOfMeasure" NOT NULL DEFAULT 'PIECE',
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minThreshold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityNeeded" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_inventoryId_productId_key" ON "recipe_items"("inventoryId", "productId");

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
