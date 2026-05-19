-- CreateTable
CREATE TABLE "Review" (
    "id" STRING NOT NULL,
    "userId" STRING,
    "name" STRING NOT NULL,
    "email" STRING,
    "rating" INT4 NOT NULL,
    "title" STRING NOT NULL,
    "body" STRING NOT NULL,
    "status" STRING NOT NULL DEFAULT 'published',
    "helpfulCount" INT4 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_status_deletedAt_createdAt_idx" ON "Review"("status", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_deletedAt_idx" ON "Review"("deletedAt");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
