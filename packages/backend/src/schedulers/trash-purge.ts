import type { PrismaClient } from "@prisma/client";
import type { StorageProvider } from "../services/storage.js";
import { collectDescendantFiles } from "../modules/files/files.service.js";

const BATCH_SIZE = 100;
const PURGE_AFTER_DAYS = 30;

export async function processTrashPurge(
  prisma: PrismaClient,
  storage: StorageProvider,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PURGE_AFTER_DAYS);

  let totalPurged = 0;
  let hasMore = true;

  while (hasMore) {
    const files = await prisma.file.findMany({
      where: {
        trashedAt: { lt: cutoff },
        workspaceId: { not: undefined },
      },
      select: { id: true, isFolder: true, storagePath: true, thumbnailPath: true },
      take: BATCH_SIZE,
    });

    if (files.length === 0) {
      hasMore = false;
      break;
    }

    for (const file of files) {
      const storagePaths: string[] = [];

      if (file.isFolder) {
        const descendants = await collectDescendantFiles(prisma, file.id);
        for (const desc of descendants) {
          if (desc.storagePath) storagePaths.push(desc.storagePath);
        }
      } else {
        if (file.storagePath) storagePaths.push(file.storagePath);
      }

      if (file.thumbnailPath) storagePaths.push(file.thumbnailPath);

      // Delete DB record (cascade deletes children for folders)
      await prisma.file.delete({ where: { id: file.id } });

      // Delete storage files
      for (const sp of storagePaths) {
        await storage.delete(sp).catch(() => {});
      }

      totalPurged++;
    }

    hasMore = files.length === BATCH_SIZE;
  }

  return totalPurged;
}
