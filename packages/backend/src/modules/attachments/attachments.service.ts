import type { PrismaClient } from "@prisma/client";
import type { StorageProvider } from "../../services/storage.js";
import type { AttachmentQueryInput, LinkAttachmentInput } from "@pm/shared";
import { NotFoundError } from "../../utils/errors.js";

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

  const stream = storage.readStream(attachment.file!.storagePath!);
  return { stream, attachment };
}

export async function deleteAttachment(
  prisma: PrismaClient,
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
