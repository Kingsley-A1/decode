-- CreateTable
CREATE TABLE "LandingPageTemplate" (
    "id" STRING NOT NULL,
    "key" STRING NOT NULL,
    "type" STRING NOT NULL,
    "label" STRING NOT NULL,
    "description" STRING NOT NULL,
    "category" STRING NOT NULL,
    "industry" STRING NOT NULL,
    "status" STRING NOT NULL DEFAULT 'draft',
    "source" STRING NOT NULL DEFAULT 'admin',
    "sortPriority" INT4 NOT NULL DEFAULT 1000,
    "flags" JSONB NOT NULL,
    "tags" JSONB NOT NULL,
    "recommendedFor" STRING NOT NULL,
    "requiredFields" JSONB NOT NULL,
    "optionalFields" JSONB NOT NULL,
    "defaultTitle" STRING NOT NULL,
    "defaultContent" JSONB NOT NULL,
    "thumbnail" JSONB NOT NULL,
    "mobilePreview" JSONB NOT NULL,
    "accessibilityNotes" STRING NOT NULL,
    "usageCount" INT4 NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdByAdminUserId" STRING,
    "updatedByAdminUserId" STRING,

    CONSTRAINT "LandingPageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPageTemplateAsset" (
    "id" STRING NOT NULL,
    "templateId" STRING NOT NULL,
    "slot" STRING NOT NULL,
    "label" STRING NOT NULL,
    "kind" STRING NOT NULL,
    "required" BOOL NOT NULL DEFAULT false,
    "assetPath" STRING,
    "alt" STRING,
    "width" INT4,
    "height" INT4,
    "sortOrder" INT4 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPageTemplateAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPageTemplateUsage" (
    "id" STRING NOT NULL,
    "templateId" STRING NOT NULL,
    "workspaceId" STRING,
    "landingPageId" STRING,
    "actorUserId" STRING,
    "context" STRING NOT NULL DEFAULT 'landing_page_create',
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingPageTemplateUsage_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "LandingPage" ADD COLUMN "templateId" STRING;

-- CreateIndex
CREATE UNIQUE INDEX "LandingPageTemplate_key_key" ON "LandingPageTemplate"("key");

-- CreateIndex
CREATE INDEX "LandingPageTemplate_status_sortPriority_updatedAt_idx" ON "LandingPageTemplate"("status", "sortPriority", "updatedAt");

-- CreateIndex
CREATE INDEX "LandingPageTemplate_category_status_idx" ON "LandingPageTemplate"("category", "status");

-- CreateIndex
CREATE INDEX "LandingPageTemplate_type_status_idx" ON "LandingPageTemplate"("type", "status");

-- CreateIndex
CREATE INDEX "LandingPageTemplate_source_status_idx" ON "LandingPageTemplate"("source", "status");

-- CreateIndex
CREATE INDEX "LandingPageTemplate_deletedAt_updatedAt_idx" ON "LandingPageTemplate"("deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "LandingPageTemplate_createdByAdminUserId_createdAt_idx" ON "LandingPageTemplate"("createdByAdminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "LandingPageTemplate_updatedByAdminUserId_updatedAt_idx" ON "LandingPageTemplate"("updatedByAdminUserId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPageTemplateAsset_templateId_slot_key" ON "LandingPageTemplateAsset"("templateId", "slot");

-- CreateIndex
CREATE INDEX "LandingPageTemplateAsset_templateId_sortOrder_idx" ON "LandingPageTemplateAsset"("templateId", "sortOrder");

-- CreateIndex
CREATE INDEX "LandingPageTemplateAsset_kind_required_idx" ON "LandingPageTemplateAsset"("kind", "required");

-- CreateIndex
CREATE INDEX "LandingPageTemplateUsage_templateId_usedAt_idx" ON "LandingPageTemplateUsage"("templateId", "usedAt");

-- CreateIndex
CREATE INDEX "LandingPageTemplateUsage_workspaceId_usedAt_idx" ON "LandingPageTemplateUsage"("workspaceId", "usedAt");

-- CreateIndex
CREATE INDEX "LandingPageTemplateUsage_landingPageId_usedAt_idx" ON "LandingPageTemplateUsage"("landingPageId", "usedAt");

-- CreateIndex
CREATE INDEX "LandingPageTemplateUsage_actorUserId_usedAt_idx" ON "LandingPageTemplateUsage"("actorUserId", "usedAt");

-- CreateIndex
CREATE INDEX "LandingPage_templateId_idx" ON "LandingPage"("templateId");

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LandingPageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPageTemplate" ADD CONSTRAINT "LandingPageTemplate_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPageTemplate" ADD CONSTRAINT "LandingPageTemplate_updatedByAdminUserId_fkey" FOREIGN KEY ("updatedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPageTemplateAsset" ADD CONSTRAINT "LandingPageTemplateAsset_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LandingPageTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPageTemplateUsage" ADD CONSTRAINT "LandingPageTemplateUsage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LandingPageTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPageTemplateUsage" ADD CONSTRAINT "LandingPageTemplateUsage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPageTemplateUsage" ADD CONSTRAINT "LandingPageTemplateUsage_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPageTemplateUsage" ADD CONSTRAINT "LandingPageTemplateUsage_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
