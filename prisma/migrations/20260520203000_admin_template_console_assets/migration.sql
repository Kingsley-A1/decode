-- AlterTable
ALTER TABLE "LandingPageTemplateAsset" ADD COLUMN "uploadedAssetId" STRING;

-- CreateTable
CREATE TABLE "LandingPageTemplateUploadedAsset" (
    "id" STRING NOT NULL,
    "uploaderAdminUserId" STRING,
    "bucket" STRING NOT NULL,
    "key" STRING NOT NULL,
    "publicUrl" STRING,
    "contentType" STRING NOT NULL,
    "fileSizeBytes" INT4 NOT NULL,
    "checksum" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LandingPageTemplateUploadedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandingPageTemplateUploadedAsset_key_key" ON "LandingPageTemplateUploadedAsset"("key");

-- CreateIndex
CREATE INDEX "LandingPageTemplateUploadedAsset_uploaderAdminUserId_createdAt_idx" ON "LandingPageTemplateUploadedAsset"("uploaderAdminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "LandingPageTemplateUploadedAsset_deletedAt_createdAt_idx" ON "LandingPageTemplateUploadedAsset"("deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "LandingPageTemplateAsset_uploadedAssetId_idx" ON "LandingPageTemplateAsset"("uploadedAssetId");

-- AddForeignKey
ALTER TABLE "LandingPageTemplateAsset" ADD CONSTRAINT "LandingPageTemplateAsset_uploadedAssetId_fkey" FOREIGN KEY ("uploadedAssetId") REFERENCES "LandingPageTemplateUploadedAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPageTemplateUploadedAsset" ADD CONSTRAINT "LandingPageTemplateUploadedAsset_uploaderAdminUserId_fkey" FOREIGN KEY ("uploaderAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
