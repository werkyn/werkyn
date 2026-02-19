-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "fileId" TEXT;

-- CreateIndex
CREATE INDEX "Attachment_fileId_idx" ON "Attachment"("fileId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
