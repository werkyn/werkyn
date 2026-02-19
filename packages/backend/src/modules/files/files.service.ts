import type { PrismaClient } from "@prisma/client";
import type { StorageProvider } from "../../services/storage.js";
import type {
  CreateFolderInput,
  UpdateFileInput,
  FileQueryInput,
} from "@pm/shared";
import type { Readable } from "node:stream";
import crypto from "node:crypto";
import path from "node:path";
import { env } from "../../config/env.js";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";
import { assertFileAccess, resolveTeamFolderForParent } from "./file-access.js";

interface AccessContext {
  userId: string;
  workspaceRole: string;
}

export async function uploadFileStream(
  prisma: PrismaClient,
  storage: StorageProvider,
  workspaceId: string,
  uploadedById: string,
  parentId: string | undefined,
  fileName: string,
  mimeType: string,
  stream: Readable,
  ctx: AccessContext,
) {
  // Run access checks BEFORE streaming to avoid writing a large file then failing
  if (parentId) {
    await assertFileAccess(prisma, parentId, ctx, true);
  }

  const teamFolderId = await resolveTeamFolderForParent(prisma, parentId);
  const isTeamContext = !!teamFolderId;

  const ext = path.extname(fileName) || "";
  const fileId = crypto.randomUUID();

  const scopeId = isTeamContext
    ? `groupfolders/${teamFolderId}`
    : uploadedById;

  // Stream to disk with size enforcement
  const { storagePath, size } = await storage.saveStream(
    "files",
    scopeId,
    fileId,
    ext,
    stream,
    { maxSize: env.MAX_FILE_SIZE },
  );

  // Create DB record — clean up file on failure
  try {
    const file = await prisma.file.create({
      data: {
        workspaceId,
        parentId: parentId || null,
        name: fileName,
        mimeType,
        size,
        storagePath,
        isFolder: false,
        uploadedById,
        ownerId: isTeamContext ? null : uploadedById,
        teamFolderId: teamFolderId,
      },
    });

    return file;
  } catch (err) {
    await storage.delete(storagePath);
    throw err;
  }
}

export async function createFolder(
  prisma: PrismaClient,
  workspaceId: string,
  uploadedById: string,
  input: CreateFolderInput,
  ctx: AccessContext,
) {
  // Check access on parent if specified
  if (input.parentId) {
    await assertFileAccess(prisma, input.parentId, ctx, true);
  }

  const teamFolderId =
    input.teamFolderId ??
    (await resolveTeamFolderForParent(prisma, input.parentId));
  const isTeamContext = !!teamFolderId;

  // If teamFolderId was explicitly provided, verify it exists and user has access
  if (input.teamFolderId) {
    const tf = await prisma.teamFolder.findUnique({
      where: { id: input.teamFolderId },
    });
    if (!tf) throw new NotFoundError("Team folder not found");
    await assertFileAccess(prisma, tf.folderId, ctx, true);
  }

  const folder = await prisma.file.create({
    data: {
      workspaceId,
      parentId: input.parentId || null,
      name: input.name,
      isFolder: true,
      uploadedById,
      ownerId: isTeamContext ? null : uploadedById,
      teamFolderId: teamFolderId,
    },
  });

  return folder;
}

export async function listFiles(
  prisma: PrismaClient,
  workspaceId: string,
  query: FileQueryInput,
  ctx: AccessContext,
) {
  const { parentId, teamFolderId, search, cursor, limit, trashed } = query;

  const where: Record<string, unknown> = {
    workspaceId,
  };

  if (trashed) {
    where.trashedAt = { not: null };

    // Scope trash to personal files + team folder files user can access
    if (ctx.workspaceRole !== "ADMIN") {
      const userTeamFolderIds = await getUserTeamFolderIds(prisma, ctx.userId);
      where.OR = [
        { ownerId: ctx.userId },
        ...(userTeamFolderIds.length > 0
          ? [{ teamFolderId: { in: userTeamFolderIds } }]
          : []),
      ];
    }
  } else {
    where.trashedAt = null;

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
      // Scope search to accessible files
      if (ctx.workspaceRole !== "ADMIN") {
        const userTeamFolderIds = await getUserTeamFolderIds(prisma, ctx.userId);
        where.OR = [
          { ownerId: ctx.userId },
          ...(userTeamFolderIds.length > 0
            ? [{ teamFolderId: { in: userTeamFolderIds } }]
            : []),
        ];
      }
    } else if (parentId) {
      // Inside a specific folder — check access on parent
      await assertFileAccess(prisma, parentId, ctx);
      where.parentId = parentId;
    } else {
      // Root listing — only personal files (team folders shown separately)
      where.parentId = null;
      where.ownerId = ctx.userId;
    }
  }

  const files = await prisma.file.findMany({
    where,
    orderBy: [{ isFolder: "desc" }, { name: "asc" }],
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      uploadedBy: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  const hasMore = files.length > limit;
  const data = hasMore ? files.slice(0, limit) : files;

  return {
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
  };
}

export async function getFile(
  prisma: PrismaClient,
  workspaceId: string,
  fileId: string,
  ctx: AccessContext,
) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, workspaceId },
    include: {
      uploadedBy: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  if (!file) throw new NotFoundError("File not found");

  await assertFileAccess(prisma, fileId, ctx);

  return file;
}

export async function downloadFile(
  storage: StorageProvider,
  prisma: PrismaClient,
  workspaceId: string,
  fileId: string,
  ctx: AccessContext,
) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, workspaceId, isFolder: false },
  });

  if (!file || !file.storagePath) {
    throw new NotFoundError("File not found");
  }

  await assertFileAccess(prisma, fileId, ctx);

  const stream = storage.readStream(file.storagePath);
  return { stream, file };
}

export async function updateFile(
  prisma: PrismaClient,
  workspaceId: string,
  fileId: string,
  input: UpdateFileInput,
  ctx: AccessContext,
) {
  const existing = await prisma.file.findFirst({
    where: { id: fileId, workspaceId },
    include: { asTeamFolder: { select: { id: true } } },
  });
  if (!existing) throw new NotFoundError("File not found");

  await assertFileAccess(prisma, fileId, ctx, true);

  // If moving (changing parentId), validate same scope
  if (input.parentId !== undefined) {
    const sourceTeamFolderId = existing.teamFolderId;
    const destTeamFolderId = input.parentId
      ? await resolveTeamFolderForParent(prisma, input.parentId)
      : null;

    // Check access on destination
    if (input.parentId) {
      await assertFileAccess(prisma, input.parentId, ctx, true);
    }

    // Prevent cross-scope moves
    if (sourceTeamFolderId !== destTeamFolderId) {
      const sourceIsPersonal = !sourceTeamFolderId && !existing.asTeamFolder;
      const destIsPersonal = !destTeamFolderId;

      if (!(sourceIsPersonal && destIsPersonal)) {
        throw new ForbiddenError(
          "Cannot move files between personal drive and team folders",
        );
      }
    }
  }

  const file = await prisma.file.update({
    where: { id: fileId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.parentId !== undefined
        ? { parentId: input.parentId }
        : {}),
      ...(input.trashedAt !== undefined
        ? { trashedAt: input.trashedAt }
        : {}),
    },
  });

  return file;
}

export async function getFileBreadcrumbs(
  prisma: PrismaClient,
  workspaceId: string,
  fileId: string,
  ctx: AccessContext,
) {
  await assertFileAccess(prisma, fileId, ctx);

  const breadcrumbs: Array<{ id: string; name: string }> = [];
  let currentId: string | null = fileId;

  while (currentId) {
    const found: { id: string; name: string; parentId: string | null } | null =
      await prisma.file.findFirst({
        where: { id: currentId, workspaceId },
        select: { id: true, name: true, parentId: true },
      });

    if (!found) break;
    breadcrumbs.unshift({ id: found.id, name: found.name });
    currentId = found.parentId;
  }

  return breadcrumbs;
}

export async function deleteFile(
  prisma: PrismaClient,
  storage: StorageProvider,
  workspaceId: string,
  fileId: string,
  ctx: AccessContext,
) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, workspaceId },
  });
  if (!file) throw new NotFoundError("File not found");

  await assertFileAccess(prisma, fileId, ctx, true);

  if (file.isFolder) {
    const descendants = await collectDescendantFiles(prisma, fileId);
    await prisma.file.delete({ where: { id: fileId } });
    for (const desc of descendants) {
      if (desc.storagePath) {
        await storage.delete(desc.storagePath);
      }
    }
  } else {
    await prisma.file.delete({ where: { id: fileId } });
    if (file.storagePath) {
      await storage.delete(file.storagePath);
    }
  }
}

export async function getFileAttachmentCount(
  prisma: PrismaClient,
  workspaceId: string,
  fileId: string,
  ctx: AccessContext,
) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, workspaceId },
  });
  if (!file) throw new NotFoundError("File not found");

  await assertFileAccess(prisma, fileId, ctx);

  const count = await prisma.attachment.count({
    where: { fileId },
  });

  return { count };
}

async function collectDescendantFiles(
  prisma: PrismaClient,
  parentId: string,
): Promise<Array<{ id: string; storagePath: string | null }>> {
  const children = await prisma.file.findMany({
    where: { parentId },
    select: { id: true, storagePath: true, isFolder: true },
  });

  const result: Array<{ id: string; storagePath: string | null }> = [];
  for (const child of children) {
    result.push({ id: child.id, storagePath: child.storagePath });
    if (child.isFolder) {
      const nested = await collectDescendantFiles(prisma, child.id);
      result.push(...nested);
    }
  }

  return result;
}

async function getUserTeamFolderIds(
  prisma: PrismaClient,
  userId: string,
): Promise<string[]> {
  const memberships = await prisma.teamFolderMember.findMany({
    where: { userId },
    select: { teamFolderId: true },
  });
  return memberships.map((m) => m.teamFolderId);
}
