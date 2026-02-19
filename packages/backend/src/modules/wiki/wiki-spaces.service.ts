import type { PrismaClient } from "@prisma/client";
import type { CreateWikiSpaceInput, UpdateWikiSpaceInput } from "@pm/shared";
import { ConflictError, NotFoundError } from "../../utils/errors.js";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function createSpace(
  prisma: PrismaClient,
  workspaceId: string,
  data: CreateWikiSpaceInput,
) {
  let slug = generateSlug(data.name);

  // Ensure slug uniqueness within workspace
  const existing = await prisma.wikiSpace.findUnique({
    where: { workspaceId_slug: { workspaceId, slug } },
  });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Position: append at end
  const maxPos = await prisma.wikiSpace.aggregate({
    where: { workspaceId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  return prisma.wikiSpace.create({
    data: {
      workspaceId,
      name: data.name,
      slug,
      description: data.description,
      icon: data.icon,
      position,
    },
  });
}

export async function listSpaces(prisma: PrismaClient, workspaceId: string) {
  return prisma.wikiSpace.findMany({
    where: { workspaceId },
    orderBy: { position: "asc" },
    include: {
      _count: { select: { pages: true } },
    },
  });
}

export async function getSpace(prisma: PrismaClient, spaceId: string) {
  const space = await prisma.wikiSpace.findUnique({
    where: { id: spaceId },
    include: {
      _count: { select: { pages: true } },
    },
  });
  if (!space) throw new NotFoundError("Wiki space not found");
  return space;
}

export async function updateSpace(
  prisma: PrismaClient,
  spaceId: string,
  data: UpdateWikiSpaceInput,
) {
  const existing = await prisma.wikiSpace.findUnique({
    where: { id: spaceId },
  });
  if (!existing) throw new NotFoundError("Wiki space not found");

  return prisma.wikiSpace.update({
    where: { id: spaceId },
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      position: data.position,
    },
  });
}

export async function deleteSpace(prisma: PrismaClient, spaceId: string) {
  const existing = await prisma.wikiSpace.findUnique({
    where: { id: spaceId },
  });
  if (!existing) throw new NotFoundError("Wiki space not found");

  await prisma.wikiSpace.delete({ where: { id: spaceId } });
}
