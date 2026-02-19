import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { NotFoundError, ForbiddenError } from "../../utils/errors.js";

export async function createShare(
  prisma: PrismaClient,
  pageId: string,
  createdById: string,
  password?: string,
) {
  // Check for existing share
  const existing = await prisma.wikiPageShare.findUnique({
    where: { pageId },
  });
  if (existing) {
    return existing;
  }

  const token = randomUUID();
  const passwordHash = password
    ? await bcrypt.hash(password, 10)
    : undefined;

  return prisma.wikiPageShare.create({
    data: {
      pageId,
      token,
      passwordHash,
      createdById,
    },
  });
}

export async function getShare(prisma: PrismaClient, pageId: string) {
  return prisma.wikiPageShare.findUnique({
    where: { pageId },
  });
}

export async function updateShare(
  prisma: PrismaClient,
  shareId: string,
  data: { enabled?: boolean; password?: string | null },
) {
  const existing = await prisma.wikiPageShare.findUnique({
    where: { id: shareId },
  });
  if (!existing) throw new NotFoundError("Share not found");

  const updateData: Record<string, unknown> = {};
  if (data.enabled !== undefined) updateData.enabled = data.enabled;
  if (data.password !== undefined) {
    updateData.passwordHash = data.password
      ? await bcrypt.hash(data.password, 10)
      : null;
  }

  return prisma.wikiPageShare.update({
    where: { id: shareId },
    data: updateData,
  });
}

export async function deleteShare(prisma: PrismaClient, shareId: string) {
  const existing = await prisma.wikiPageShare.findUnique({
    where: { id: shareId },
  });
  if (!existing) throw new NotFoundError("Share not found");

  await prisma.wikiPageShare.delete({ where: { id: shareId } });
}

export async function getPublicPage(prisma: PrismaClient, token: string) {
  const share = await prisma.wikiPageShare.findUnique({
    where: { token },
    include: {
      page: {
        select: {
          id: true,
          title: true,
          content: true,
          icon: true,
          updatedAt: true,
          createdBy: { select: { displayName: true } },
          lastEditedBy: { select: { displayName: true } },
        },
      },
    },
  });

  if (!share || !share.enabled) {
    throw new NotFoundError("Shared page not found");
  }

  return {
    page: share.page,
    hasPassword: !!share.passwordHash,
  };
}

export async function validateShareAccess(
  prisma: PrismaClient,
  token: string,
  password: string,
) {
  const share = await prisma.wikiPageShare.findUnique({
    where: { token },
  });

  if (!share || !share.enabled) {
    throw new NotFoundError("Shared page not found");
  }

  if (!share.passwordHash) {
    return true;
  }

  const valid = await bcrypt.compare(password, share.passwordHash);
  if (!valid) {
    throw new ForbiddenError("Invalid password");
  }

  return true;
}
