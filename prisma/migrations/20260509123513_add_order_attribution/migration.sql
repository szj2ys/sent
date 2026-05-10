-- AlterTable
ALTER TABLE "AbandonedCheckout" ADD COLUMN "orderId" TEXT;

-- AlterTable
ALTER TABLE "MessageLog" ADD COLUMN "clickedAt" DATETIME;

-- CreateTable
CREATE TABLE "OrderAttribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "messageLogId" TEXT NOT NULL,
    "abandonedCheckoutId" TEXT NOT NULL,
    "recoveredAmount" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "attributedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderAttribution_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderAttribution_messageLogId_fkey" FOREIGN KEY ("messageLogId") REFERENCES "MessageLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderAttribution_abandonedCheckoutId_fkey" FOREIGN KEY ("abandonedCheckoutId") REFERENCES "AbandonedCheckout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderAttribution_orderId_key" ON "OrderAttribution"("orderId");

-- CreateIndex
CREATE INDEX "OrderAttribution_shopId_idx" ON "OrderAttribution"("shopId");

-- CreateIndex
CREATE INDEX "OrderAttribution_abandonedCheckoutId_idx" ON "OrderAttribution"("abandonedCheckoutId");
