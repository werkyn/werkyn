-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_MENTION';
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_DM_MESSAGE';

-- AlterTable: ChatChannel - add archive fields
ALTER TABLE "ChatChannel" ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedById" TEXT;

-- AlterTable: ChatMessage - add pin fields
ALTER TABLE "ChatMessage" ADD COLUMN "pinnedAt" TIMESTAMP(3),
ADD COLUMN "pinnedById" TEXT;

-- AlterTable: NotificationPreference - add chat preference fields
ALTER TABLE "NotificationPreference" ADD COLUMN "chatMention" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "chatDmMessage" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ChatBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatThreadSubscription" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatThreadSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatBookmark_userId_idx" ON "ChatBookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatBookmark_userId_messageId_key" ON "ChatBookmark"("userId", "messageId");

-- CreateIndex
CREATE INDEX "ChatThreadSubscription_messageId_idx" ON "ChatThreadSubscription"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatThreadSubscription_messageId_userId_key" ON "ChatThreadSubscription"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "ChatChannel" ADD CONSTRAINT "ChatChannel_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatBookmark" ADD CONSTRAINT "ChatBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatBookmark" ADD CONSTRAINT "ChatBookmark_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThreadSubscription" ADD CONSTRAINT "ChatThreadSubscription_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThreadSubscription" ADD CONSTRAINT "ChatThreadSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
