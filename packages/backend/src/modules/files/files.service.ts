import type { PrismaClient } from "@prisma/client";
import type { StorageProvider } from "../../services/storage.js";
import type {
  CreateFolderInput,
  UpdateFileInput,
  FileQueryInput,
  CopyFileInput,
} from "@pm/shared";
import type { Readable } from "node:stream";
import { PassThrough } from "node:stream";
import crypto from "node:crypto";
import path from "node:path";
import archiver from "archiver";
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
    `${workspaceId}/files`,
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
  const { parentId, teamFolderId, search, cursor, limit, trashed, sortBy, sortOrder } = query;

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

  const orderBy: Record<string, unknown>[] = [{ isFolder: "desc" }];
  if (sortBy === "uploadedBy") {
    orderBy.push({ uploadedBy: { displayName: sortOrder } });
  } else {
    orderBy.push({ [sortBy]: sortOrder });
  }

  const files = await prisma.file.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      uploadedBy: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  const hasMore = files.length > limit;
  const sliced = hasMore ? files.slice(0, limit) : files;

  // Batch-query starred status for the current user
  const fileIds = sliced.map((f) => f.id);
  const starredSet = new Set(
    fileIds.length > 0
      ? (
          await prisma.starredFile.findMany({
            where: { userId: ctx.userId, fileId: { in: fileIds } },
            select: { fileId: true },
          })
        ).map((s) => s.fileId)
      : [],
  );

  const data = sliced.map((f) => ({ ...f, starred: starredSet.has(f.id) }));

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

export async function starFile(
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

  await prisma.starredFile.upsert({
    where: { userId_fileId: { userId: ctx.userId, fileId } },
    create: { userId: ctx.userId, fileId },
    update: {},
  });
}

export async function unstarFile(
  prisma: PrismaClient,
  workspaceId: string,
  fileId: string,
  ctx: AccessContext,
) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, workspaceId },
  });
  if (!file) throw new NotFoundError("File not found");

  await prisma.starredFile.deleteMany({
    where: { userId: ctx.userId, fileId },
  });
}

export async function listStarredFiles(
  prisma: PrismaClient,
  workspaceId: string,
  ctx: AccessContext,
) {
  const starred = await prisma.starredFile.findMany({
    where: {
      userId: ctx.userId,
      file: { workspaceId, trashedAt: null },
    },
    include: {
      file: {
        include: {
          uploadedBy: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return starred.map((s) => ({ ...s.file, starred: true }));
}

export async function copyFile(
  prisma: PrismaClient,
  storage: StorageProvider,
  workspaceId: string,
  fileId: string,
  input: CopyFileInput,
  ctx: AccessContext,
) {
  const source = await prisma.file.findFirst({
    where: { id: fileId, workspaceId, isFolder: false },
  });

  if (!source || !source.storagePath) {
    throw new NotFoundError("File not found");
  }

  // Assert read access on source
  await assertFileAccess(prisma, fileId, ctx);

  // Assert write access on destination
  if (input.parentId) {
    await assertFileAccess(prisma, input.parentId, ctx, true);
  }

  // Resolve team folder context
  const sourceTeamFolderId = source.teamFolderId;
  const destTeamFolderId = input.parentId
    ? await resolveTeamFolderForParent(prisma, input.parentId)
    : null;

  // Prevent cross-scope copies (personal <-> team)
  const sourceIsPersonal = !sourceTeamFolderId;
  const destIsPersonal = !destTeamFolderId;
  if (sourceIsPersonal !== destIsPersonal) {
    throw new ForbiddenError(
      "Cannot copy files between personal drive and team folders",
    );
  }

  const ext = path.extname(source.name) || "";
  const baseName = source.name.slice(0, source.name.length - ext.length);
  const copyName = `${baseName} (copy)${ext}`;
  const newFileId = crypto.randomUUID();

  const scopeId = destTeamFolderId
    ? `groupfolders/${destTeamFolderId}`
    : ctx.userId;

  // Copy storage
  const sourceStream = storage.readStream(source.storagePath);
  const { storagePath, size } = await storage.saveStream(
    `${workspaceId}/files`,
    scopeId,
    newFileId,
    ext,
    sourceStream,
    { maxSize: env.MAX_FILE_SIZE },
  );

  // Create DB record — clean up on failure
  try {
    const file = await prisma.file.create({
      data: {
        workspaceId,
        parentId: input.parentId,
        name: copyName,
        mimeType: source.mimeType,
        size,
        storagePath,
        isFolder: false,
        uploadedById: ctx.userId,
        ownerId: destTeamFolderId ? null : ctx.userId,
        teamFolderId: destTeamFolderId,
      },
    });

    return file;
  } catch (err) {
    await storage.delete(storagePath);
    throw err;
  }
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

// ── Archive ──────────────────────────────────

interface ArchiveEntry {
  name: string;
  storagePath: string;
}

async function collectFolderEntries(
  prisma: PrismaClient,
  storage: StorageProvider,
  parentId: string,
  prefix: string,
): Promise<ArchiveEntry[]> {
  const children = await prisma.file.findMany({
    where: { parentId, trashedAt: null },
    select: { id: true, name: true, isFolder: true, storagePath: true },
  });

  const entries: ArchiveEntry[] = [];
  for (const child of children) {
    if (child.isFolder) {
      const nested = await collectFolderEntries(
        prisma,
        storage,
        child.id,
        `${prefix}${child.name}/`,
      );
      entries.push(...nested);
    } else if (child.storagePath) {
      entries.push({ name: `${prefix}${child.name}`, storagePath: child.storagePath });
    }
  }
  return entries;
}

export async function archiveFiles(
  prisma: PrismaClient,
  storage: StorageProvider,
  workspaceId: string,
  fileIds: string[],
  ctx: AccessContext,
): Promise<{ stream: PassThrough; archiveName: string }> {
  // Validate all files belong to workspace and are not trashed
  const files = await prisma.file.findMany({
    where: { id: { in: fileIds }, workspaceId, trashedAt: null },
    select: { id: true, name: true, isFolder: true, storagePath: true },
  });

  if (files.length === 0) throw new NotFoundError("No files found");

  // Assert read access on each file
  for (const file of files) {
    await assertFileAccess(prisma, file.id, ctx);
  }

  // Collect all entries, expanding folders recursively
  const entries: ArchiveEntry[] = [];
  for (const file of files) {
    if (file.isFolder) {
      const nested = await collectFolderEntries(prisma, storage, file.id, `${file.name}/`);
      entries.push(...nested);
    } else if (file.storagePath) {
      entries.push({ name: file.name, storagePath: file.storagePath });
    }
  }

  // Archive name
  const archiveName =
    files.length === 1 && files[0].isFolder
      ? `${files[0].name}.zip`
      : "files.zip";

  const passthrough = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 6 } });

  archive.on("error", (err) => passthrough.destroy(err));
  archive.pipe(passthrough);

  for (const entry of entries) {
    const fileStream = storage.readStream(entry.storagePath);
    archive.append(fileStream, { name: entry.name });
  }

  archive.finalize();

  return { stream: passthrough, archiveName };
}
