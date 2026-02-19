import type { FastifyRequest, FastifyReply } from "fastify";
import * as attachmentsService from "./attachments.service.js";
import type { AttachmentQueryInput, LinkAttachmentInput } from "@pm/shared";
import { ValidationError } from "../../utils/errors.js";

export async function uploadAttachmentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const data = await request.file();

  if (!data) {
    throw new ValidationError("No file uploaded");
  }

  const entityType =
    (data.fields.entityType as { value?: string })?.value;
  const entityId =
    (data.fields.entityId as { value?: string })?.value;

  if (!entityType || !entityId) {
    throw new ValidationError("entityType and entityId are required");
  }

  if (entityType !== "task" && entityType !== "comment") {
    throw new ValidationError("entityType must be 'task' or 'comment'");
  }

  // Detect client disconnect and destroy the upload stream to trigger cleanup
  request.raw.on("close", () => {
    if (request.raw.destroyed || !request.raw.complete) {
      data.file.destroy(new Error("Client disconnected"));
    }
  });

  const attachment = await attachmentsService.uploadAttachmentStream(
    request.server.prisma,
    request.server.storage,
    params.wid,
    request.user!.id,
    entityType,
    entityId,
    data.filename,
    data.mimetype,
    data.file,
  );

  return reply.status(201).send({ data: attachment });
}

export async function listAttachmentsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const query = request.query as AttachmentQueryInput;

  const result = await attachmentsService.listAttachments(
    request.server.prisma,
    params.wid,
    query,
  );

  return reply.send(result);
}

export async function downloadAttachmentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; aid: string };

  const { stream, attachment } = await attachmentsService.downloadAttachment(
    request.server.storage,
    request.server.prisma,
    params.wid,
    params.aid,
  );

  const safeName = attachment.name.replace(/"/g, '\\"');
  const encodedName = encodeURIComponent(attachment.name);

  return reply
    .header(
      "Content-Disposition",
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
    )
    .header("Content-Type", "application/octet-stream")
    .send(stream);
}

export async function deleteAttachmentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; aid: string };

  await attachmentsService.deleteAttachment(
    request.server.prisma,
    request.server.storage,
    params.wid,
    params.aid,
  );

  return reply.status(204).send();
}

export async function linkAttachmentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const body = request.body as LinkAttachmentInput;

  const attachment = await attachmentsService.linkAttachment(
    request.server.prisma,
    params.wid,
    request.user!.id,
    body,
  );

  return reply.status(201).send({ data: attachment });
}
