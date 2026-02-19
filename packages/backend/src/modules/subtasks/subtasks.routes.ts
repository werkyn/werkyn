import type { FastifyInstance } from "fastify";
import {
  listSubtasksHandler,
  createSubtaskHandler,
  updateSubtaskHandler,
  toggleSubtaskHandler,
  reorderSubtasksHandler,
  deleteSubtaskHandler,
} from "./subtasks.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import {
  CreateSubtaskSchema,
  UpdateSubtaskSchema,
  BulkUpdateTasksSchema,
} from "./subtasks.schemas.js";

export default async function subtasksRoutes(fastify: FastifyInstance) {
  // GET /api/tasks/:tid/subtasks
  fastify.route({
    method: "GET",
    url: "/tasks/:tid/subtasks",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: listSubtasksHandler,
  });

  // POST /api/tasks/:tid/subtasks
  fastify.route({
    method: "POST",
    url: "/tasks/:tid/subtasks",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(CreateSubtaskSchema),
    ],
    handler: createSubtaskHandler,
  });

  // PATCH /api/subtasks/:id
  fastify.route({
    method: "PATCH",
    url: "/subtasks/:id",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(UpdateSubtaskSchema),
    ],
    handler: updateSubtaskHandler,
  });

  // PATCH /api/subtasks/:id/toggle
  fastify.route({
    method: "PATCH",
    url: "/subtasks/:id/toggle",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: toggleSubtaskHandler,
  });

  // POST /api/tasks/:tid/subtasks/reorder
  fastify.route({
    method: "POST",
    url: "/tasks/:tid/subtasks/reorder",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(BulkUpdateTasksSchema),
    ],
    handler: reorderSubtasksHandler,
  });

  // DELETE /api/subtasks/:id
  fastify.route({
    method: "DELETE",
    url: "/subtasks/:id",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: deleteSubtaskHandler,
  });
}
