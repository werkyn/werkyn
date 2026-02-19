import type { PrismaClient } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";

async function hasTeamFolderAccess(
  prisma: PrismaClient,
  teamFolderId: string,
  userId: string,
): Promise<boolean> {
  const directMember = await prisma.teamFolderMember.findUnique({
    where: { teamFolderId_userId: { teamFolderId, userId } },
  });
  if (directMember) return true;

  const groupAccess = await prisma.teamFolderGroup.findFirst({
    where: {
      teamFolderId,
      group: { members: { some: { userId } } },
    },
  });
  return !!groupAccess;
}

interface AccessContext {
  userId: string;
  workspaceRole: string;
}

interface AccessResult {
  type: "personal" | "team";
  teamFolderId?: string;
}

/**
 * Checks whether the given user can access a file.
 * Admins always pass. Personal files require owner match.
 * Team folder files require team folder membership.
 */
export async function assertFileAccess(
  prisma: PrismaClient,
  fileId: string,
  ctx: AccessContext,
  requireWrite = false,
): Promise<AccessResult> {
  if (ctx.workspaceRole === "ADMIN") {
    // Admins can access everything — still determine type for callers
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { ownerId: true, teamFolderId: true, asTeamFolder: { select: { id: true } } },
    });
    if (!file) throw new NotFoundError("File not found");

    if (file.teamFolderId) return { type: "team", teamFolderId: file.teamFolderId };
    if (file.asTeamFolder) return { type: "team", teamFolderId: file.asTeamFolder.id };
    return { type: "personal" };
  }

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      ownerId: true,
      teamFolderId: true,
      asTeamFolder: { select: { id: true } },
    },
  });

  if (!file) throw new NotFoundError("File not found");

  // Personal file — owner match
  if (file.ownerId) {
    if (file.ownerId !== ctx.userId) {
      throw new ForbiddenError("You do not have access to this file");
    }
    return { type: "personal" };
  }

  // Team folder root (the folder record itself that is the root of a team folder)
  if (file.asTeamFolder) {
    const hasAccess = await hasTeamFolderAccess(prisma, file.asTeamFolder.id, ctx.userId);
    if (!hasAccess) {
      throw new ForbiddenError("You do not have access to this team folder");
    }
    return { type: "team", teamFolderId: file.asTeamFolder.id };
  }

  // File inside a team folder
  if (file.teamFolderId) {
    const hasAccess = await hasTeamFolderAccess(prisma, file.teamFolderId, ctx.userId);
    if (!hasAccess) {
      throw new ForbiddenError("You do not have access to this team folder");
    }
    return { type: "team", teamFolderId: file.teamFolderId };
  }

  // Fallback — personal file with no ownerId (shouldn't happen after backfill)
  throw new ForbiddenError("You do not have access to this file");
}

/**
 * Given a parentId, resolves the teamFolderId context for new files created inside it.
 * Returns the teamFolderId if parent is a team folder root or inside a team folder.
 * Returns null for personal file context.
 */
export async function resolveTeamFolderForParent(
  prisma: PrismaClient,
  parentId: string | null | undefined,
): Promise<string | null> {
  if (!parentId) return null;

  const parent = await prisma.file.findUnique({
    where: { id: parentId },
    select: {
      teamFolderId: true,
      asTeamFolder: { select: { id: true } },
    },
  });

  if (!parent) return null;

  // Parent is the root folder of a team folder
  if (parent.asTeamFolder) return parent.asTeamFolder.id;

  // Parent is inside a team folder
  if (parent.teamFolderId) return parent.teamFolderId;

  return null;
}
