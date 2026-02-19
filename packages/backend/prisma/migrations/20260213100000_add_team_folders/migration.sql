-- AlterTable
ALTER TABLE "File" ADD COLUMN "ownerId" TEXT,
ADD COLUMN "teamFolderId" TEXT;

-- CreateTable
CREATE TABLE "TeamFolder" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamFolderMember" (
    "id" TEXT NOT NULL,
    "teamFolderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamFolderMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamFolder_folderId_key" ON "TeamFolder"("folderId");

-- CreateIndex
CREATE INDEX "TeamFolder_workspaceId_idx" ON "TeamFolder"("workspaceId");

-- CreateIndex
CREATE INDEX "TeamFolderMember_userId_idx" ON "TeamFolderMember"("userId");

-- CreateIndex
CREATE INDEX "TeamFolderMember_teamFolderId_idx" ON "TeamFolderMember"("teamFolderId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamFolderMember_teamFolderId_userId_key" ON "TeamFolderMember"("teamFolderId", "userId");

-- CreateIndex
CREATE INDEX "File_ownerId_idx" ON "File"("ownerId");

-- CreateIndex
CREATE INDEX "File_teamFolderId_idx" ON "File"("teamFolderId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_teamFolderId_fkey" FOREIGN KEY ("teamFolderId") REFERENCES "TeamFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamFolder" ADD CONSTRAINT "TeamFolder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamFolder" ADD CONSTRAINT "TeamFolder_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamFolderMember" ADD CONSTRAINT "TeamFolderMember_teamFolderId_fkey" FOREIGN KEY ("teamFolderId") REFERENCES "TeamFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamFolderMember" ADD CONSTRAINT "TeamFolderMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: set ownerId on all existing files
UPDATE "File" SET "ownerId" = "uploadedById" WHERE "ownerId" IS NULL;
