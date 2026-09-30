-- CreateEnum
CREATE TYPE "PakasirPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELED');

-- CreateTable
CREATE TABLE "pakasir_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "pwaOrderId" TEXT,
    "txnId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "fee" INTEGER NOT NULL DEFAULT 0,
    "totalPayment" INTEGER NOT NULL DEFAULT 0,
    "status" "PakasirPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentLink" TEXT,
    "qrString" TEXT,
    "vaNumber" TEXT,
    "expiredAt" TIMESTAMP(3),
    "isSandbox" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pakasir_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pakasir_payments_orderId_key" ON "pakasir_payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "pakasir_payments_txnId_key" ON "pakasir_payments"("txnId");

-- CreateIndex
CREATE INDEX "pakasir_payments_pwaOrderId_idx" ON "pakasir_payments"("pwaOrderId");

-- CreateIndex
CREATE INDEX "pakasir_payments_status_idx" ON "pakasir_payments"("status");

-- AddForeignKey
ALTER TABLE "pakasir_payments" ADD CONSTRAINT "pakasir_payments_pwaOrderId_fkey" FOREIGN KEY ("pwaOrderId") REFERENCES "pwa_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
