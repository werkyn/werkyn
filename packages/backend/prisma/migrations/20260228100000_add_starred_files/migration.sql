-- CreateTable
CREATE TABLE "StarredFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarredFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StarredFile_userId_idx" ON "StarredFile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StarredFile_userId_fileId_key" ON "StarredFile"("userId", "fileId");

-- AddForeignKey
ALTER TABLE "StarredFile" ADD CONSTRAINT "StarredFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarredFile" ADD CONSTRAINT "StarredFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
