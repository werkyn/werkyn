import type { FastifyInstance } from "fastify";
import {
  uploadFileHandler,
  createFolderHandler,
  listFilesHandler,
  getFileHandler,
  downloadFileHandler,
  updateFileHandler,
  getFileBreadcrumbsHandler,
  getFileAttachmentCountHandler,
  deleteFileHandler,
} from "./files.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate, validateQuery } from "../../middleware/validate.js";
import {
  CreateFolderSchema,
  UpdateFileSchema,
  FileQuerySchema,
} from "@pm/shared";

export default async function filesRoutes(fastify: FastifyInstance) {
  // POST /api/workspaces/:wid/files/upload — Upload file (multipart)
  fastify.route({
    method: "POST",
    url: "/workspaces/:wid/files/upload",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: uploadFileHandler,
  });

  // POST /api/workspaces/:wid/files/folder — Create folder
  fastify.route({
    method: "POST",
    url: "/workspaces/:wid/files/folder",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(CreateFolderSchema),
    ],
    handler: createFolderHandler,
  });

  // GET /api/workspaces/:wid/files — List files
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/files",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER", "VIEWER"),
      validateQuery(FileQuerySchema),
    ],
    handler: listFilesHandler,
  });

  // GET /api/workspaces/:wid/files/:fid — Get file metadata
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/files/:fid",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: getFileHandler,
  });

  // GET /api/workspaces/:wid/files/:fid/download — Stream file content
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/files/:fid/download",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: downloadFileHandler,
  });

  // GET /api/workspaces/:wid/files/:fid/breadcrumbs — Get breadcrumb path
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/files/:fid/breadcrumbs",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: getFileBreadcrumbsHandler,
  });

  // PATCH /api/workspaces/:wid/files/:fid — Rename or move file
  fastify.route({
    method: "PATCH",
    url: "/workspaces/:wid/files/:fid",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(UpdateFileSchema),
    ],
    handler: updateFileHandler,
  });

  // GET /api/workspaces/:wid/files/:fid/attachments-count — Check linked attachments
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/files/:fid/attachments-count",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: getFileAttachmentCountHandler,
  });

  // DELETE /api/workspaces/:wid/files/:fid — Delete file/folder
  fastify.route({
    method: "DELETE",
    url: "/workspaces/:wid/files/:fid",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: deleteFileHandler,
  });
}
