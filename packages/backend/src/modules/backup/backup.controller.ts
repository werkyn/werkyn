import type { FastifyRequest, FastifyReply } from "fastify";
import type { BackupExportRequest } from "@pm/shared";
import { exportBackup } from "./backup.service.js";
import { previewRestore, executeRestore } from "./restore.service.js";
import { ValidationError } from "../../utils/errors.js";

export async function exportHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { wid } = request.params as { wid: string };
  const body = request.body as BackupExportRequest;

  if (body.projects.length === 0 && body.channels.length === 0) {
    throw new ValidationError("Select at least one project or channel to export");
  }

  const backup = await exportBackup(request.server.prisma, wid, body);

  const filename = `backup-${backup.metadata.sourceWorkspace.slug}-${new Date().toISOString().slice(0, 10)}.json`;

  return reply
    .header("Content-Type", "application/json")
    .header("Content-Disposition", `attachment; filename="${filename}"`)
    .send(JSON.stringify(backup, null, 2));
}

async function consumeFileBuffer(request: FastifyRequest): Promise<Buffer> {
  const file = await request.file();
  if (!file) {
    throw new ValidationError("No file uploaded");
  }
  if (!file.filename.endsWith(".json")) {
    throw new ValidationError("Only .json files are accepted");
  }
  const chunks: Buffer[] = [];
  for await (const chunk of file.file) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function previewHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { wid } = request.params as { wid: string };
  const buffer = await consumeFileBuffer(request);

  const summary = await previewRestore(
    request.server.prisma,
    wid,
    request.user!.id,
    buffer,
  );

  return reply.send({ data: summary });
}

export async function restoreHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { wid } = request.params as { wid: string };
  const buffer = await consumeFileBuffer(request);

  const summary = await executeRestore(
    request.server.prisma,
    wid,
    request.user!.id,
    buffer,
  );

  return reply.send({ data: summary });
}
