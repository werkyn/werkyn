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

  const purpose =
    (data.fields.purpose as { value?: string })?.value || "general";

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

  const storagePath = await request.server.storage.save(
    purpose === "avatar" ? "avatars" : "uploads",
    request.user!.id,
    fileId,
    ext,
    buffer,
  );

  const url = `/storage/${storagePath}`;

  return reply.status(201).send({ data: { url } });
}
