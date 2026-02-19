-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'TASK_DUE_SOON', 'COMMENT_ADDED', 'COMMENT_MENTION');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" VARCHAR(1000),
    "read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskAssigned" BOOLEAN NOT NULL DEFAULT true,
    "taskStatusChanged" BOOLEAN NOT NULL DEFAULT true,
    "taskDueSoon" BOOLEAN NOT NULL DEFAULT true,
    "commentAdded" BOOLEAN NOT NULL DEFAULT true,
    "commentMention" BOOLEAN NOT NULL DEFAULT true,
    "dueDateReminderTiming" TEXT NOT NULL DEFAULT '1_day_before',
    "pushSubscription" JSONB,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
