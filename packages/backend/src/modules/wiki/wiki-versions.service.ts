import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../utils/errors.js";

export async function createAutoSaveVersion(
  prisma: PrismaClient,
  pageId: string,
  actorId: string,
) {
  const page = await prisma.wikiPage.findUnique({
    where: { id: pageId },
    select: { id: true, title: true, content: true },
  });
  if (!page) return null;

  // Check if last auto-save was within 5 minutes
  const recent = await prisma.wikiPageVersion.findFirst({
    where: { pageId, isAutoSave: true },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (recent) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (recent.createdAt > fiveMinAgo) return null;
  }

  const nextVersion = await getNextVersionNumber(prisma, pageId);

  return prisma.wikiPageVersion.create({
    data: {
      pageId,
      title: page.title,
      content: page.content ?? undefined,
      versionNumber: nextVersion,
      isAutoSave: true,
      createdById: actorId,
    },
  });
}

export async function createNamedVersion(
  prisma: PrismaClient,
  pageId: string,
  actorId: string,
  name: string,
) {
  const page = await prisma.wikiPage.findUnique({
    where: { id: pageId },
    select: { id: true, title: true, content: true },
  });
  if (!page) throw new NotFoundError("Wiki page not found");

  const nextVersion = await getNextVersionNumber(prisma, pageId);

  return prisma.wikiPageVersion.create({
    data: {
      pageId,
      title: page.title,
      content: page.content ?? undefined,
      versionNumber: nextVersion,
      name,
      isAutoSave: false,
      createdById: actorId,
    },
    include: {
      createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
}

export async function listVersions(
  prisma: PrismaClient,
  pageId: string,
  cursor?: string,
  limit = 20,
) {
  const versions = await prisma.wikiPageVersion.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  const hasMore = versions.length > limit;
  if (hasMore) versions.pop();

  return {
    data: versions,
    nextCursor: hasMore ? versions[versions.length - 1].id : null,
  };
}

export async function getVersion(prisma: PrismaClient, versionId: string) {
  const version = await prisma.wikiPageVersion.findUnique({
    where: { id: versionId },
    include: {
      createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
  if (!version) throw new NotFoundError("Version not found");
  return version;
}

export async function restoreVersion(
  prisma: PrismaClient,
  versionId: string,
  actorId: string,
) {
  const version = await prisma.wikiPageVersion.findUnique({
    where: { id: versionId },
    select: { id: true, pageId: true, title: true, content: true },
  });
  if (!version) throw new NotFoundError("Version not found");

  // Create a snapshot of current state before restoring
  await createAutoSaveVersion(prisma, version.pageId, actorId);

  // Restore the page
  return prisma.wikiPage.update({
    where: { id: version.pageId },
    data: {
      title: version.title,
      content: version.content ?? undefined,
      lastEditedById: actorId,
    },
    select: {
      id: true,
      spaceId: true,
      title: true,
      content: true,
      updatedAt: true,
    },
  });
}

async function getNextVersionNumber(prisma: PrismaClient, pageId: string) {
  const maxVersion = await prisma.wikiPageVersion.aggregate({
    where: { pageId },
    _max: { versionNumber: true },
  });
  return (maxVersion._max.versionNumber ?? 0) + 1;
}
