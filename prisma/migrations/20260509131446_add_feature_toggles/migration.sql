-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "twilioAccountSid" TEXT,
    "twilioAuthToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "enableAbandonedCart" BOOLEAN NOT NULL DEFAULT true,
    "enableOrderConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Shop" ("createdAt", "domain", "id", "isActive", "twilioAccountSid", "twilioAuthToken") SELECT "createdAt", "domain", "id", "isActive", "twilioAccountSid", "twilioAuthToken" FROM "Shop";
DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
CREATE UNIQUE INDEX "Shop_domain_key" ON "Shop"("domain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MessageLog_createdAt_idx" ON "MessageLog"("createdAt");
