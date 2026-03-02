import type { FastifyRequest, FastifyReply } from "fastify";
import path from "node:path";
import crypto from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { ValidationError } from "../../utils/errors.js";

const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function uploadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = await request.file();

  if (!data) {
    throw new ValidationError("No file uploaded");
  }

  const workspaceId = (data.fields.workspaceId as { value?: string })?.value;
  if (!workspaceId) throw new ValidationError("workspaceId is required");

  const purpose = (data.fields.purpose as { value?: string })?.value;
  if (!purpose) throw new ValidationError("purpose is required");
  const spaceId = (data.fields.spaceId as { value?: string })?.value;

  const ext = path.extname(data.filename) || ".bin";
  const fileId = crypto.randomUUID();

  const buffer = await data.toBuffer();

  if (purpose === "avatar") {
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || !ALLOWED_AVATAR_TYPES.includes(detected.mime)) {
      throw new ValidationError(
        "Avatar must be a JPEG, PNG, GIF, or WebP image",
      );
    }
  }

  let scopeId: string;
  if (purpose === "avatar") {
    scopeId = `avatars/${request.user!.id}`;
  } else if (purpose === "wiki" && spaceId) {
    scopeId = `wiki/${spaceId}`;
  } else {
    throw new ValidationError(`Unsupported upload purpose: ${purpose}`);
  }

  const storagePath = await request.server.storage.save(
    `${workspaceId}/uploads`,
    scopeId,
    fileId,
    ext,
    buffer,
  );

  const url = `/storage/${storagePath}`;

  return reply.status(201).send({ data: { url } });
}
