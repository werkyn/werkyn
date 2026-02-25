import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { BackupExportRequestSchema } from "@pm/shared";
import {
  exportHandler,
  previewHandler,
  restoreHandler,
} from "./backup.controller.js";

export default async function backupRoutes(fastify: FastifyInstance) {
  // POST /api/workspaces/:wid/backup/export
  fastify.route({
    method: "POST",
    url: "/:wid/backup/export",
    preHandler: [authenticate, authorize("ADMIN"), validate(BackupExportRequestSchema)],
    handler: exportHandler,
  });

  // POST /api/workspaces/:wid/backup/preview
  fastify.route({
    method: "POST",
    url: "/:wid/backup/preview",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: previewHandler,
  });

  // POST /api/workspaces/:wid/backup/restore
  fastify.route({
    method: "POST",
    url: "/:wid/backup/restore",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: restoreHandler,
  });
}
