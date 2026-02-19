-- AlterTable
ALTER TABLE "Task" ADD COLUMN "startDate" TEXT;

-- CreateIndex
CREATE INDEX "Task_projectId_startDate_idx" ON "Task"("projectId", "startDate");
