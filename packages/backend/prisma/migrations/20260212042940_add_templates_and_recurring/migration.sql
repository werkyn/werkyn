-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "TaskReminderSent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskReminderSent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "statusId" TEXT,
    "dueOffset" INTEGER,
    "assigneeIds" JSONB NOT NULL DEFAULT '[]',
    "labelIds" JSONB NOT NULL DEFAULT '[]',
    "subtasks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTaskConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "nextRunDate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringTaskConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskReminderSent_sentAt_idx" ON "TaskReminderSent"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaskReminderSent_taskId_userId_dueDate_key" ON "TaskReminderSent"("taskId", "userId", "dueDate");

-- CreateIndex
CREATE INDEX "TaskTemplate_projectId_idx" ON "TaskTemplate"("projectId");

-- CreateIndex
CREATE INDEX "RecurringTaskConfig_projectId_idx" ON "RecurringTaskConfig"("projectId");

-- CreateIndex
CREATE INDEX "RecurringTaskConfig_isActive_nextRunDate_idx" ON "RecurringTaskConfig"("isActive", "nextRunDate");

-- AddForeignKey
ALTER TABLE "TaskReminderSent" ADD CONSTRAINT "TaskReminderSent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReminderSent" ADD CONSTRAINT "TaskReminderSent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTaskConfig" ADD CONSTRAINT "RecurringTaskConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTaskConfig" ADD CONSTRAINT "RecurringTaskConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
