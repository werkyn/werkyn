import type { PrismaClient, Prisma } from "@prisma/client";
import type {
  CreateWikiPageInput,
  UpdateWikiPageInput,
  MoveWikiPageInput,
} from "@pm/shared";
import { NotFoundError } from "../../utils/errors.js";

const pageSelect = {
  id: true,
  spaceId: true,
  parentId: true,
  title: true,
  icon: true,
  position: true,
  createdById: true,
  lastEditedById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
  lastEditedBy: { select: { id: true, displayName: true, avatarUrl: true } },
} satisfies Prisma.WikiPageSelect;

const pageWithContentSelect = {
  ...pageSelect,
  content: true,
} satisfies Prisma.WikiPageSelect;

export async function createPage(
  prisma: PrismaClient,
  spaceId: string,
  actorId: string,
  data: CreateWikiPageInput,
) {
  const space = await prisma.wikiSpace.findUnique({
    where: { id: spaceId },
    select: { id: true },
  });
  if (!space) throw new NotFoundError("Wiki space not found");

  if (data.parentId) {
    const parent = await prisma.wikiPage.findUnique({
      where: { id: data.parentId },
      select: { id: true, spaceId: true },
    });
    if (!parent || parent.spaceId !== spaceId) {
      throw new NotFoundError("Parent page not found in this space");
    }
  }

  // Position: append at end of siblings
  const maxPos = await prisma.wikiPage.aggregate({
    where: { spaceId, parentId: data.parentId ?? null },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  return prisma.wikiPage.create({
    data: {
      spaceId,
      parentId: data.parentId,
      title: data.title,
      content: data.content ?? undefined,
      icon: data.icon,
      position,
      createdById: actorId,
    },
    select: pageWithContentSelect,
  });
}

export async function getPageTree(
  prisma: PrismaClient,
  spaceId: string,
  parentId?: string,
) {
  return prisma.wikiPage.findMany({
    where: {
      spaceId,
      parentId: parentId ?? null,
    },
    orderBy: { position: "asc" },
    select: {
      ...pageSelect,
      _count: { select: { children: true } },
    },
  });
}

export async function getPage(prisma: PrismaClient, pageId: string) {
  const page = await prisma.wikiPage.findUnique({
    where: { id: pageId },
    select: pageWithContentSelect,
  });
  if (!page) throw new NotFoundError("Wiki page not found");
  return page;
}

export async function updatePage(
  prisma: PrismaClient,
  pageId: string,
  actorId: string,
  data: UpdateWikiPageInput,
) {
  const existing = await prisma.wikiPage.findUnique({
    where: { id: pageId },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError("Wiki page not found");

  const updateData: Prisma.WikiPageUpdateInput = {
    lastEditedBy: { connect: { id: actorId } },
  };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.icon !== undefined) updateData.icon = data.icon;

  return prisma.wikiPage.update({
    where: { id: pageId },
    data: updateData,
    select: pageWithContentSelect,
  });
}

export async function deletePage(prisma: PrismaClient, pageId: string) {
  const existing = await prisma.wikiPage.findUnique({
    where: { id: pageId },
    select: { id: true, spaceId: true },
  });
  if (!existing) throw new NotFoundError("Wiki page not found");

  await prisma.wikiPage.delete({ where: { id: pageId } });
  return existing;
}

export async function movePage(
  prisma: PrismaClient,
  pageId: string,
  data: MoveWikiPageInput,
) {
  const existing = await prisma.wikiPage.findUnique({
    where: { id: pageId },
    select: { id: true, spaceId: true, parentId: true, position: true },
  });
  if (!existing) throw new NotFoundError("Wiki page not found");

  const targetSpaceId = data.spaceId ?? existing.spaceId;
  const targetParentId = data.parentId !== undefined ? data.parentId : existing.parentId;

  // Prevent circular reference
  if (targetParentId === pageId) {
    throw new NotFoundError("Cannot move page under itself");
  }

  return prisma.$transaction(async (tx) => {
    // Normalize positions of siblings at the target location
    const siblings = await tx.wikiPage.findMany({
      where: {
        spaceId: targetSpaceId,
        parentId: targetParentId,
        id: { not: pageId },
      },
      orderBy: { position: "asc" },
      select: { id: true },
    });

    const insertIdx = Math.min(data.position, siblings.length);
    siblings.splice(insertIdx, 0, { id: pageId });

    for (let i = 0; i < siblings.length; i++) {
      await tx.wikiPage.update({
        where: { id: siblings[i].id },
        data: {
          position: i,
          ...(siblings[i].id === pageId
            ? { spaceId: targetSpaceId, parentId: targetParentId }
            : {}),
        },
      });
    }

    return tx.wikiPage.findUnique({
      where: { id: pageId },
      select: pageSelect,
    });
  });
}

export async function getBreadcrumbs(prisma: PrismaClient, pageId: string) {
  const breadcrumbs: Array<{ id: string; title: string; icon: string | null }> = [];

  let currentId: string | null = pageId;
  while (currentId) {
    const node: { id: string; title: string; icon: string | null; parentId: string | null } | null =
      await prisma.wikiPage.findUnique({
        where: { id: currentId },
        select: { id: true, title: true, icon: true, parentId: true },
      });
    if (!node) break;
    breadcrumbs.unshift({ id: node.id, title: node.title, icon: node.icon });
    currentId = node.parentId;
  }

  return breadcrumbs;
}
