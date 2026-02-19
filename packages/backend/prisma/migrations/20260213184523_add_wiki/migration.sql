-- CreateTable
CREATE TABLE "WikiSpace" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPage" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" VARCHAR(500) NOT NULL,
    "content" JSONB,
    "icon" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "lastEditedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPageVersion" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" JSONB,
    "versionNumber" INTEGER NOT NULL,
    "name" VARCHAR(255),
    "isAutoSave" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WikiPageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPageLock" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "heartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WikiPageLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPageComment" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" VARCHAR(10000) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "highlightId" VARCHAR(100) NOT NULL,
    "selectionStart" JSONB,
    "selectionEnd" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiPageComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPageShare" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "passwordHash" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiPageShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WikiSpace_workspaceId_position_idx" ON "WikiSpace"("workspaceId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "WikiSpace_workspaceId_slug_key" ON "WikiSpace"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "WikiPage_spaceId_parentId_position_idx" ON "WikiPage"("spaceId", "parentId", "position");

-- CreateIndex
CREATE INDEX "WikiPage_createdById_idx" ON "WikiPage"("createdById");

-- CreateIndex
CREATE INDEX "WikiPageVersion_pageId_createdAt_idx" ON "WikiPageVersion"("pageId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WikiPageLock_pageId_key" ON "WikiPageLock"("pageId");

-- CreateIndex
CREATE INDEX "WikiPageLock_expiresAt_idx" ON "WikiPageLock"("expiresAt");

-- CreateIndex
CREATE INDEX "WikiPageComment_pageId_resolved_idx" ON "WikiPageComment"("pageId", "resolved");

-- CreateIndex
CREATE UNIQUE INDEX "WikiPageShare_pageId_key" ON "WikiPageShare"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "WikiPageShare_token_key" ON "WikiPageShare"("token");

-- CreateIndex
CREATE INDEX "WikiPageShare_token_idx" ON "WikiPageShare"("token");

-- AddForeignKey
ALTER TABLE "WikiSpace" ADD CONSTRAINT "WikiSpace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "WikiSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageVersion" ADD CONSTRAINT "WikiPageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageVersion" ADD CONSTRAINT "WikiPageVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageLock" ADD CONSTRAINT "WikiPageLock_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageLock" ADD CONSTRAINT "WikiPageLock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageComment" ADD CONSTRAINT "WikiPageComment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageComment" ADD CONSTRAINT "WikiPageComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageComment" ADD CONSTRAINT "WikiPageComment_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPageShare" ADD CONSTRAINT "WikiPageShare_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
