import type { PrismaClient } from "@prisma/client";
import type { StorageProvider } from "../../services/storage.js";
import type { AttachmentQueryInput, LinkAttachmentInput } from "@pm/shared";
import type { Readable } from "node:stream";
import crypto from "node:crypto";
import path from "node:path";
import { env } from "../../config/env.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";

export async function uploadAttachmentStream(
  prisma: PrismaClient,
  storage: StorageProvider,
  workspaceId: string,
  uploadedById: string,
  entityType: string,
  entityId: string,
  fileName: string,
  mimeType: string,
  stream: Readable,
) {
  const ext = path.extname(fileName) || "";
  const fileId = crypto.randomUUID();

  const { storagePath, size } = await storage.saveStream(
    "attachments",
    workspaceId,
    fileId,
    ext,
    stream,
    { maxSize: env.MAX_FILE_SIZE },
  );

  try {
    const attachment = await prisma.attachment.create({
      data: {
        workspaceId,
        entityType,
        entityId,
        name: fileName,
        mimeType,
        size,
        storagePath,
        uploadedById,
      },
    });

    return attachment;
  } catch (err) {
    await storage.delete(storagePath);
    throw err;
  }
}

export async function listAttachments(
  prisma: PrismaClient,
  workspaceId: string,
  query: AttachmentQueryInput,
) {
  const attachments = await prisma.attachment.findMany({
    where: {
      workspaceId,
      entityType: query.entityType,
      entityId: query.entityId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      file: {
        select: { id: true, name: true, trashedAt: true },
      },
    },
  });

  return { data: attachments };
}

export async function downloadAttachment(
  storage: StorageProvider,
  prisma: PrismaClient,
  workspaceId: string,
  attachmentId: string,
) {
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, workspaceId },
    include: { file: true },
  });

  if (!attachment) {
    throw new NotFoundError("Attachment not found");
  }

  // If this was a linked Drive file that's been permanently deleted, the file
  // relation will be null (onDelete: SetNull) and storage is gone
  if (attachment.fileId && !attachment.file) {
    throw new NotFoundError(
      "The linked Drive file has been deleted. This attachment is no longer available.",
    );
  }

  const storagePath =
    attachment.fileId && attachment.file?.storagePath
      ? attachment.file.storagePath
      : attachment.storagePath;

  const stream = storage.readStream(storagePath);
  return { stream, attachment };
}

export async function deleteAttachment(
  prisma: PrismaClient,
  storage: StorageProvider,
  workspaceId: string,
  attachmentId: string,
) {
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, workspaceId },
  });

  if (!attachment) {
    throw new NotFoundError("Attachment not found");
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });

  // Only delete from storage if it's a direct upload (not a Drive link)
  if (!attachment.fileId) {
    await storage.delete(attachment.storagePath);
  }
}

export async function linkAttachment(
  prisma: PrismaClient,
  workspaceId: string,
  uploadedById: string,
  input: LinkAttachmentInput,
) {
  const file = await prisma.file.findFirst({
    where: {
      id: input.fileId,
      workspaceId,
      isFolder: false,
      trashedAt: null,
    },
  });

  if (!file) {
    throw new NotFoundError("File not found in workspace");
  }

  const attachment = await prisma.attachment.create({
    data: {
      workspaceId,
      entityType: input.entityType,
      entityId: input.entityId,
      name: file.name,
      mimeType: file.mimeType ?? "application/octet-stream",
      size: file.size ?? 0,
      storagePath: file.storagePath ?? "",
      uploadedById,
      fileId: file.id,
    },
  });

  return attachment;
}
