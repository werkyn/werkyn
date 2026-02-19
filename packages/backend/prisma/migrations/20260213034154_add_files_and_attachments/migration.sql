-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "storagePath" TEXT,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" TEXT NOT NULL,
    "trashedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "File_workspaceId_parentId_idx" ON "File"("workspaceId", "parentId");

-- CreateIndex
CREATE INDEX "File_workspaceId_trashedAt_idx" ON "File"("workspaceId", "trashedAt");

-- CreateIndex
CREATE INDEX "File_uploadedById_idx" ON "File"("uploadedById");

-- CreateIndex
CREATE INDEX "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Attachment_workspaceId_idx" ON "Attachment"("workspaceId");

-- CreateIndex
CREATE INDEX "Attachment_uploadedById_idx" ON "Attachment"("uploadedById");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
