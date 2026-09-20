-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'CASHIER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QRIS', 'TRANSFER');

-- CreateEnum
CREATE TYPE "PwaOrderStatus" AS ENUM ('PENDING_CONFIRMATION', 'BEING_PREPARED', 'READY_FOR_PICKUP', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CASHIER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDrink" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "sku" TEXT,
    "image" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "cashierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" INTEGER NOT NULL,
    "subTotal" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pwa_orders" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "customerId" TEXT,
    "totalAmount" INTEGER NOT NULL,
    "orderType" TEXT NOT NULL DEFAULT 'DINE_IN',
    "status" "PwaOrderStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "paymentMethod" "PaymentMethod",
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pwa_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pointCost" INTEGER NOT NULL,
    "qtyExchange" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSetting" (
    "id" TEXT NOT NULL DEFAULT 'kofilo-store-1',
    "storeName" TEXT NOT NULL DEFAULT 'Craft Coffee',
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "address" TEXT,
    "mapsUrl" TEXT,
    "operatingHours" TEXT,
    "isStoreOpen" BOOLEAN NOT NULL DEFAULT true,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minOrderAmount" INTEGER NOT NULL DEFAULT 0,
    "acceptCash" BOOLEAN NOT NULL DEFAULT true,
    "acceptQris" BOOLEAN NOT NULL DEFAULT true,
    "acceptTransfer" BOOLEAN NOT NULL DEFAULT false,
    "loyaltyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rewardPerAmount" INTEGER NOT NULL DEFAULT 10000,
    "pointsEarned" INTEGER NOT NULL DEFAULT 1,
    "registrationPoints" INTEGER NOT NULL DEFAULT 0,
    "pointsExpiryDays" INTEGER NOT NULL DEFAULT 365,
    "receiptFooter" TEXT,
    "wifiName" TEXT,
    "wifiPassword" TEXT,
    "pwaBanners" JSONB DEFAULT '[]',
    "pwaEnableTakeaway" BOOLEAN NOT NULL DEFAULT true,
    "pwaWelcomeBg" TEXT,
    "pwaWelcomeSubtitle" TEXT DEFAULT 'TABLE DASHBOARD',
    "pwaFooterText" TEXT DEFAULT '© 2026 KOFILO. PREMIUM EXPERIENCE.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "reward_products_code_key" ON "reward_products"("code");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pwa_orders" ADD CONSTRAINT "pwa_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
