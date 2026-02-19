import type { FastifyRequest, FastifyReply } from "fastify";
import * as filesService from "./files.service.js";
import type {
  CreateFolderInput,
  UpdateFileInput,
  FileQueryInput,
} from "@pm/shared";
import { ValidationError } from "../../utils/errors.js";

function getAccessCtx(request: FastifyRequest) {
  return {
    userId: request.user!.id,
    workspaceRole: request.workspaceMember!.role,
  };
}

export async function uploadFileHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const data = await request.file();

  if (!data) {
    throw new ValidationError("No file uploaded");
  }

  const parentId =
    (data.fields.parentId as { value?: string })?.value || undefined;

  // Detect client disconnect and destroy the upload stream to trigger cleanup
  request.raw.on("close", () => {
    if (request.raw.destroyed || !request.raw.complete) {
      data.file.destroy(new Error("Client disconnected"));
    }
  });

  const file = await filesService.uploadFileStream(
    request.server.prisma,
    request.server.storage,
    params.wid,
    request.user!.id,
    parentId,
    data.filename,
    data.mimetype,
    data.file,
    getAccessCtx(request),
  );

  return reply.status(201).send({ data: file });
}

export async function createFolderHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const body = request.body as CreateFolderInput;

  const folder = await filesService.createFolder(
    request.server.prisma,
    params.wid,
    request.user!.id,
    body,
    getAccessCtx(request),
  );

  return reply.status(201).send({ data: folder });
}

export async function listFilesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const query = request.query as FileQueryInput;

  const result = await filesService.listFiles(
    request.server.prisma,
    params.wid,
    query,
    getAccessCtx(request),
  );

  return reply.send(result);
}

export async function getFileHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; fid: string };

  const file = await filesService.getFile(
    request.server.prisma,
    params.wid,
    params.fid,
    getAccessCtx(request),
  );

  return reply.send({ data: file });
}

export async function downloadFileHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; fid: string };

  const { stream, file } = await filesService.downloadFile(
    request.server.storage,
    request.server.prisma,
    params.wid,
    params.fid,
    getAccessCtx(request),
  );

  const safeName = file.name.replace(/"/g, '\\"');
  const encodedName = encodeURIComponent(file.name);

  return reply
    .header(
      "Content-Disposition",
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
    )
    .header("Content-Type", "application/octet-stream")
    .send(stream);
}

export async function updateFileHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; fid: string };
  const body = request.body as UpdateFileInput;

  const file = await filesService.updateFile(
    request.server.prisma,
    params.wid,
    params.fid,
    body,
    getAccessCtx(request),
  );

  return reply.send({ data: file });
}

export async function getFileBreadcrumbsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; fid: string };

  const breadcrumbs = await filesService.getFileBreadcrumbs(
    request.server.prisma,
    params.wid,
    params.fid,
    getAccessCtx(request),
  );

  return reply.send({ data: breadcrumbs });
}

export async function getFileAttachmentCountHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; fid: string };

  const result = await filesService.getFileAttachmentCount(
    request.server.prisma,
    params.wid,
    params.fid,
    getAccessCtx(request),
  );

  return reply.send({ data: result });
}

export async function deleteFileHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; fid: string };

  await filesService.deleteFile(
    request.server.prisma,
    request.server.storage,
    params.wid,
    params.fid,
    getAccessCtx(request),
  );

  return reply.status(204).send();
}
