import type { FastifyInstance } from "fastify";
import {
  listStatusesHandler,
  createStatusHandler,
  updateStatusHandler,
  deleteStatusHandler,
  reorderStatusesHandler,
} from "./statuses.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import {
  CreateStatusColumnSchema,
  UpdateStatusColumnSchema,
  ReorderSchema,
} from "./statuses.schemas.js";

export default async function statusesRoutes(fastify: FastifyInstance) {
  // GET /api/projects/:pid/statuses
  fastify.route({
    method: "GET",
    url: "/:pid/statuses",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: listStatusesHandler,
  });

  // POST /api/projects/:pid/statuses
  fastify.route({
    method: "POST",
    url: "/:pid/statuses",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(CreateStatusColumnSchema),
    ],
    handler: createStatusHandler,
  });

  // PATCH /api/projects/:pid/statuses/:id
  fastify.route({
    method: "PATCH",
    url: "/:pid/statuses/:id",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(UpdateStatusColumnSchema),
    ],
    handler: updateStatusHandler,
  });

  // DELETE /api/projects/:pid/statuses/:id
  fastify.route({
    method: "DELETE",
    url: "/:pid/statuses/:id",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: deleteStatusHandler,
  });

  // PATCH /api/projects/:pid/statuses/reorder
  fastify.route({
    method: "PATCH",
    url: "/:pid/statuses/reorder",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(ReorderSchema),
    ],
    handler: reorderStatusesHandler,
  });
}
