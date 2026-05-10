-- CreateTable
CREATE TABLE "CustomerConsent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "consentedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "CustomerConsent_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageLog" (
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
    CONSTRAINT "MessageLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CustomerConsent_shopId_idx" ON "CustomerConsent"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerConsent_shopId_phoneNumber_key" ON "CustomerConsent"("shopId", "phoneNumber");

-- CreateIndex
CREATE INDEX "MessageLog_shopId_idx" ON "MessageLog"("shopId");

-- CreateIndex
CREATE INDEX "MessageLog_status_idx" ON "MessageLog"("status");
