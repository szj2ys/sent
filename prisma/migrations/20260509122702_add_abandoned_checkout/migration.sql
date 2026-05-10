-- CreateTable
CREATE TABLE "AbandonedCheckout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "checkoutToken" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "totalPrice" TEXT NOT NULL,
    "lineItems" TEXT NOT NULL,
    "scheduledTaskId" TEXT,
    "recoveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AbandonedCheckout_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MessageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "twilioSid" TEXT,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "failedReason" TEXT,
    "trackingUrl" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "abandonedCheckoutId" TEXT,
    CONSTRAINT "MessageLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageLog_abandonedCheckoutId_fkey" FOREIGN KEY ("abandonedCheckoutId") REFERENCES "AbandonedCheckout" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MessageLog" ("clickCount", "createdAt", "deliveredAt", "failedReason", "id", "phoneNumber", "sentAt", "shopId", "status", "templateId", "trackingUrl", "twilioSid", "type") SELECT "clickCount", "createdAt", "deliveredAt", "failedReason", "id", "phoneNumber", "sentAt", "shopId", "status", "templateId", "trackingUrl", "twilioSid", "type" FROM "MessageLog";
DROP TABLE "MessageLog";
ALTER TABLE "new_MessageLog" RENAME TO "MessageLog";
CREATE INDEX "MessageLog_shopId_idx" ON "MessageLog"("shopId");
CREATE INDEX "MessageLog_status_idx" ON "MessageLog"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AbandonedCheckout_shopId_idx" ON "AbandonedCheckout"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCheckout_shopId_checkoutToken_key" ON "AbandonedCheckout"("shopId", "checkoutToken");
