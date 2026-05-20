-- CreateTable
CREATE TABLE "AdminUser" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "email" STRING NOT NULL,
    "passwordHash" STRING NOT NULL,
    "role" STRING NOT NULL,
    "status" STRING NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" STRING NOT NULL,
    "adminUserId" STRING NOT NULL,
    "sessionTokenHash" STRING NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipHash" STRING,
    "userAgentHash" STRING,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuthEvent" (
    "id" STRING NOT NULL,
    "adminUserId" STRING,
    "email" STRING NOT NULL,
    "event" STRING NOT NULL,
    "outcome" STRING NOT NULL,
    "reason" STRING,
    "requestId" STRING NOT NULL,
    "ipHash" STRING,
    "userAgentHash" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuthEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAuditLog" (
    "id" STRING NOT NULL,
    "actorAdminUserId" STRING,
    "action" STRING NOT NULL,
    "entityType" STRING NOT NULL,
    "entityId" STRING,
    "requestId" STRING,
    "metadata" JSONB,
    "ipHash" STRING,
    "userAgentHash" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_role_status_idx" ON "AdminUser"("role", "status");

-- CreateIndex
CREATE INDEX "AdminUser_status_createdAt_idx" ON "AdminUser"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_sessionTokenHash_key" ON "AdminSession"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminUserId_revokedAt_expiresAt_idx" ON "AdminSession"("adminUserId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminAuthEvent_email_createdAt_idx" ON "AdminAuthEvent"("email", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuthEvent_adminUserId_createdAt_idx" ON "AdminAuthEvent"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuthEvent_event_outcome_createdAt_idx" ON "AdminAuthEvent"("event", "outcome", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuthEvent_requestId_idx" ON "AdminAuthEvent"("requestId");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_actorAdminUserId_createdAt_idx" ON "PlatformAuditLog"("actorAdminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_entityType_entityId_createdAt_idx" ON "PlatformAuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_action_createdAt_idx" ON "PlatformAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_requestId_idx" ON "PlatformAuditLog"("requestId");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_createdAt_idx" ON "PlatformAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuthEvent" ADD CONSTRAINT "AdminAuthEvent_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAuditLog" ADD CONSTRAINT "PlatformAuditLog_actorAdminUserId_fkey" FOREIGN KEY ("actorAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
