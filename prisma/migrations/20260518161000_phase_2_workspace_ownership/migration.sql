-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "name" STRING,
    "email" STRING,
    "emailVerified" TIMESTAMP(3),
    "image" STRING,
    "defaultWorkspaceId" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "type" STRING NOT NULL,
    "provider" STRING NOT NULL,
    "providerAccountId" STRING NOT NULL,
    "refresh_token" STRING,
    "access_token" STRING,
    "expires_at" INT4,
    "token_type" STRING,
    "scope" STRING,
    "id_token" STRING,
    "session_state" STRING,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" STRING NOT NULL,
    "sessionToken" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" STRING NOT NULL,
    "token" STRING NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "ownerId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" STRING NOT NULL,
    "workspaceId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "role" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" STRING NOT NULL,
    "workspaceId" STRING NOT NULL,
    "ownerId" STRING NOT NULL,
    "title" STRING NOT NULL,
    "type" STRING NOT NULL,
    "mode" STRING NOT NULL,
    "status" STRING NOT NULL,
    "slug" STRING,
    "payload" JSONB NOT NULL,
    "destinationUrl" STRING,
    "designConfig" JSONB NOT NULL,
    "scanCount" INT4 NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCodeAsset" (
    "id" STRING NOT NULL,
    "workspaceId" STRING NOT NULL,
    "qrCodeId" STRING,
    "landingPageId" STRING,
    "uploaderId" STRING,
    "purpose" STRING NOT NULL,
    "status" STRING NOT NULL,
    "bucket" STRING NOT NULL,
    "key" STRING NOT NULL,
    "publicUrl" STRING,
    "contentType" STRING NOT NULL,
    "fileSizeBytes" INT4 NOT NULL,
    "checksum" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "QRCodeAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPage" (
    "id" STRING NOT NULL,
    "workspaceId" STRING NOT NULL,
    "qrCodeId" STRING,
    "type" STRING NOT NULL,
    "title" STRING NOT NULL,
    "status" STRING NOT NULL,
    "content" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanEvent" (
    "id" STRING NOT NULL,
    "workspaceId" STRING NOT NULL,
    "qrCodeId" STRING NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceClass" STRING,
    "browser" STRING,
    "operatingSystem" STRING,
    "referrer" STRING,
    "country" STRING,
    "region" STRING,
    "ipHash" STRING,
    "userAgentHash" STRING,

    CONSTRAINT "ScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkCheck" (
    "id" STRING NOT NULL,
    "normalizedUrl" STRING NOT NULL,
    "verdict" STRING NOT NULL,
    "confidence" INT4 NOT NULL,
    "reasons" JSONB NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" STRING NOT NULL,
    "workspaceId" STRING NOT NULL,
    "actorUserId" STRING,
    "action" STRING NOT NULL,
    "entityType" STRING NOT NULL,
    "entityId" STRING NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_defaultWorkspaceId_idx" ON "User"("defaultWorkspaceId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE INDEX "Workspace_ownerId_deletedAt_idx" ON "Workspace"("ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX "Workspace_deletedAt_updatedAt_idx" ON "Workspace"("deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_deletedAt_idx" ON "WorkspaceMember"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_role_deletedAt_idx" ON "WorkspaceMember"("workspaceId", "role", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_slug_key" ON "QRCode"("slug");

-- CreateIndex
CREATE INDEX "QRCode_workspaceId_deletedAt_updatedAt_idx" ON "QRCode"("workspaceId", "deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "QRCode_workspaceId_status_updatedAt_idx" ON "QRCode"("workspaceId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "QRCode_workspaceId_mode_updatedAt_idx" ON "QRCode"("workspaceId", "mode", "updatedAt");

-- CreateIndex
CREATE INDEX "QRCode_ownerId_updatedAt_idx" ON "QRCode"("ownerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QRCodeAsset_key_key" ON "QRCodeAsset"("key");

-- CreateIndex
CREATE INDEX "QRCodeAsset_workspaceId_deletedAt_updatedAt_idx" ON "QRCodeAsset"("workspaceId", "deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "QRCodeAsset_qrCodeId_purpose_idx" ON "QRCodeAsset"("qrCodeId", "purpose");

-- CreateIndex
CREATE INDEX "QRCodeAsset_landingPageId_purpose_idx" ON "QRCodeAsset"("landingPageId", "purpose");

-- CreateIndex
CREATE INDEX "QRCodeAsset_uploaderId_createdAt_idx" ON "QRCodeAsset"("uploaderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_qrCodeId_key" ON "LandingPage"("qrCodeId");

-- CreateIndex
CREATE INDEX "LandingPage_workspaceId_deletedAt_updatedAt_idx" ON "LandingPage"("workspaceId", "deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "LandingPage_workspaceId_status_updatedAt_idx" ON "LandingPage"("workspaceId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "ScanEvent_workspaceId_scannedAt_idx" ON "ScanEvent"("workspaceId", "scannedAt");

-- CreateIndex
CREATE INDEX "ScanEvent_qrCodeId_scannedAt_idx" ON "ScanEvent"("qrCodeId", "scannedAt");

-- CreateIndex
CREATE INDEX "ScanEvent_workspaceId_deviceClass_scannedAt_idx" ON "ScanEvent"("workspaceId", "deviceClass", "scannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LinkCheck_normalizedUrl_key" ON "LinkCheck"("normalizedUrl");

-- CreateIndex
CREATE INDEX "LinkCheck_expiresAt_idx" ON "LinkCheck"("expiresAt");

-- CreateIndex
CREATE INDEX "LinkCheck_verdict_checkedAt_idx" ON "LinkCheck"("verdict", "checkedAt");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_entityType_entityId_createdAt_idx" ON "AuditLog"("workspaceId", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultWorkspaceId_fkey" FOREIGN KEY ("defaultWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCodeAsset" ADD CONSTRAINT "QRCodeAsset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCodeAsset" ADD CONSTRAINT "QRCodeAsset_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCodeAsset" ADD CONSTRAINT "QRCodeAsset_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCodeAsset" ADD CONSTRAINT "QRCodeAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

