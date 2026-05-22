-- AlterTable
ALTER TABLE "LinkCheck" ADD COLUMN "evidence" JSONB;
ALTER TABLE "LinkCheck" ADD COLUMN "probeSummary" JSONB;
ALTER TABLE "LinkCheck" ADD COLUMN "safeBrowsingTtl" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "LinkCheck_normalizedUrl_expiresAt_idx" ON "LinkCheck"("normalizedUrl", "expiresAt");

-- CreateTable
CREATE TABLE "ShortLink" (
    "id" STRING NOT NULL,
    "workspaceId" STRING,
    "ownerId" STRING,
    "slug" STRING NOT NULL,
    "destinationUrl" STRING NOT NULL,
    "normalizedUrl" STRING NOT NULL,
    "status" STRING NOT NULL DEFAULT 'active',
    "verdictAtCreate" STRING NOT NULL,
    "lastVerdict" STRING,
    "lastVerifiedAt" TIMESTAMP(3),
    "scanCount" INT4 NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_slug_key" ON "ShortLink"("slug");
CREATE INDEX "ShortLink_workspaceId_deletedAt_updatedAt_idx" ON "ShortLink"("workspaceId", "deletedAt", "updatedAt");
CREATE INDEX "ShortLink_ownerId_updatedAt_idx" ON "ShortLink"("ownerId", "updatedAt");
CREATE INDEX "ShortLink_status_expiresAt_idx" ON "ShortLink"("status", "expiresAt");
CREATE INDEX "ShortLink_normalizedUrl_idx" ON "ShortLink"("normalizedUrl");

-- AddForeignKey
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ShortLinkScan" (
    "id" STRING NOT NULL,
    "shortLinkId" STRING NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceClass" STRING,
    "browser" STRING,
    "operatingSystem" STRING,
    "referrer" STRING,
    "country" STRING,
    "region" STRING,
    "ipHash" STRING,
    "userAgentHash" STRING,

    CONSTRAINT "ShortLinkScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShortLinkScan_shortLinkId_scannedAt_idx" ON "ShortLinkScan"("shortLinkId", "scannedAt");
CREATE INDEX "ShortLinkScan_scannedAt_idx" ON "ShortLinkScan"("scannedAt");

-- AddForeignKey
ALTER TABLE "ShortLinkScan" ADD CONSTRAINT "ShortLinkScan_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
