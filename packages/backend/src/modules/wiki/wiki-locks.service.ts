import type { PrismaClient } from "@prisma/client";
import { ConflictError, NotFoundError } from "../../utils/errors.js";

const LOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutes

export async function acquireLock(
  prisma: PrismaClient,
  pageId: string,
  userId: string,
) {
  // Clean up expired locks first
  await cleanupExpiredLocks(prisma);

  const existing = await prisma.wikiPageLock.findUnique({
    where: { pageId },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  if (existing) {
    if (existing.userId === userId) {
      // Extend own lock
      return prisma.wikiPageLock.update({
        where: { pageId },
        data: {
          expiresAt: new Date(Date.now() + LOCK_DURATION_MS),
          heartbeat: new Date(),
        },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });
    }
    throw new ConflictError(
      `Page is being edited by ${existing.user.displayName}`,
    );
  }

  return prisma.wikiPageLock.create({
    data: {
      pageId,
      userId,
      expiresAt: new Date(Date.now() + LOCK_DURATION_MS),
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
}

export async function releaseLock(
  prisma: PrismaClient,
  pageId: string,
  userId: string,
) {
  const lock = await prisma.wikiPageLock.findUnique({
    where: { pageId },
  });

  if (!lock) return;
  if (lock.userId !== userId) return; // Can only release own lock

  await prisma.wikiPageLock.delete({ where: { pageId } });
}

export async function heartbeatLock(
  prisma: PrismaClient,
  pageId: string,
  userId: string,
) {
  const lock = await prisma.wikiPageLock.findUnique({
    where: { pageId },
  });

  if (!lock || lock.userId !== userId) {
    throw new NotFoundError("No active lock found");
  }

  return prisma.wikiPageLock.update({
    where: { pageId },
    data: {
      expiresAt: new Date(Date.now() + LOCK_DURATION_MS),
      heartbeat: new Date(),
    },
  });
}

export async function checkLock(prisma: PrismaClient, pageId: string) {
  await cleanupExpiredLocks(prisma);

  return prisma.wikiPageLock.findUnique({
    where: { pageId },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
}

export async function cleanupExpiredLocks(prisma: PrismaClient) {
  await prisma.wikiPageLock.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
