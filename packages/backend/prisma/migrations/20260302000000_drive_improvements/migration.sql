-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'FILE_SHARED';

-- AlterTable: File - add thumbnail path
ALTER TABLE "File" ADD COLUMN "thumbnailPath" TEXT;

-- AlterTable: NotificationPreference - add file shared pref
ALTER TABLE "NotificationPreference" ADD COLUMN "fileShared" BOOLEAN NOT NULL DEFAULT true;
