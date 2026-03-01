-- CreateTable
CREATE TABLE "FileShare" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileShareLink" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "passwordHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileShareLinkFile" (
    "id" TEXT NOT NULL,
    "shareLinkId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,

    CONSTRAINT "FileShareLinkFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileShare_workspaceId_idx" ON "FileShare"("workspaceId");
CREATE INDEX "FileShare_sharedById_idx" ON "FileShare"("sharedById");
CREATE INDEX "FileShare_sharedWithId_idx" ON "FileShare"("sharedWithId");
CREATE INDEX "FileShare_fileId_idx" ON "FileShare"("fileId");
CREATE UNIQUE INDEX "FileShare_fileId_sharedWithId_key" ON "FileShare"("fileId", "sharedWithId");

-- CreateIndex
CREATE UNIQUE INDEX "FileShareLink_token_key" ON "FileShareLink"("token");
CREATE INDEX "FileShareLink_token_idx" ON "FileShareLink"("token");
CREATE INDEX "FileShareLink_workspaceId_idx" ON "FileShareLink"("workspaceId");
CREATE INDEX "FileShareLink_createdById_idx" ON "FileShareLink"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "FileShareLinkFile_shareLinkId_fileId_key" ON "FileShareLinkFile"("shareLinkId", "fileId");
CREATE INDEX "FileShareLinkFile_fileId_idx" ON "FileShareLinkFile"("fileId");
CREATE INDEX "FileShareLinkFile_shareLinkId_idx" ON "FileShareLinkFile"("shareLinkId");

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShareLink" ADD CONSTRAINT "FileShareLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileShareLink" ADD CONSTRAINT "FileShareLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShareLinkFile" ADD CONSTRAINT "FileShareLinkFile_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "FileShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileShareLinkFile" ADD CONSTRAINT "FileShareLinkFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
