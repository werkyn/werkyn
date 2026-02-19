import type { FastifyInstance } from "fastify";
import {
  listTasksHandler,
  createTaskHandler,
  getTaskHandler,
  updateTaskHandler,
  deleteTaskHandler,
  moveTaskHandler,
  archiveTaskHandler,
  addAssigneeHandler,
  removeAssigneeHandler,
  addLabelHandler,
  removeLabelHandler,
  bulkUpdateHandler,
  bulkDeleteHandler,
  listActivityHandler,
  addDependencyHandler,
  removeDependencyHandler,
  duplicateTaskHandler,
} from "./tasks.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate, validateQuery } from "../../middleware/validate.js";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  MoveTaskSchema,
  TaskQuerySchema,
  ArchiveSchema,
  TaskAssigneeSchema,
  TaskLabelSchema,
  ActivityLogQuerySchema,
  BulkUpdateFieldsSchema,
  BulkDeleteSchema,
  TaskDependencySchema,
} from "./tasks.schemas.js";

export default async function tasksRoutes(fastify: FastifyInstance) {
  // GET /api/projects/:pid/tasks
  fastify.route({
    method: "GET",
    url: "/projects/:pid/tasks",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER", "VIEWER"),
      validateQuery(TaskQuerySchema),
    ],
    handler: listTasksHandler,
  });

  // POST /api/projects/:pid/tasks
  fastify.route({
    method: "POST",
    url: "/projects/:pid/tasks",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(CreateTaskSchema),
    ],
    handler: createTaskHandler,
  });

  // GET /api/tasks/:tid
  fastify.route({
    method: "GET",
    url: "/tasks/:tid",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: getTaskHandler,
  });

  // PATCH /api/tasks/:tid
  fastify.route({
    method: "PATCH",
    url: "/tasks/:tid",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(UpdateTaskSchema),
    ],
    handler: updateTaskHandler,
  });

  // DELETE /api/tasks/:tid
  fastify.route({
    method: "DELETE",
    url: "/tasks/:tid",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: deleteTaskHandler,
  });

  // PATCH /api/tasks/:tid/move
  fastify.route({
    method: "PATCH",
    url: "/tasks/:tid/move",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(MoveTaskSchema),
    ],
    handler: moveTaskHandler,
  });

  // PATCH /api/tasks/:tid/archive
  fastify.route({
    method: "PATCH",
    url: "/tasks/:tid/archive",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(ArchiveSchema),
    ],
    handler: archiveTaskHandler,
  });

  // POST /api/tasks/:tid/assignees
  fastify.route({
    method: "POST",
    url: "/tasks/:tid/assignees",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(TaskAssigneeSchema),
    ],
    handler: addAssigneeHandler,
  });

  // DELETE /api/tasks/:tid/assignees/:uid
  fastify.route({
    method: "DELETE",
    url: "/tasks/:tid/assignees/:uid",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: removeAssigneeHandler,
  });

  // POST /api/tasks/:tid/labels
  fastify.route({
    method: "POST",
    url: "/tasks/:tid/labels",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(TaskLabelSchema),
    ],
    handler: addLabelHandler,
  });

  // DELETE /api/tasks/:tid/labels/:lid
  fastify.route({
    method: "DELETE",
    url: "/tasks/:tid/labels/:lid",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: removeLabelHandler,
  });

  // POST /api/projects/:pid/tasks/bulk-update
  fastify.route({
    method: "POST",
    url: "/projects/:pid/tasks/bulk-update",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(BulkUpdateFieldsSchema),
    ],
    handler: bulkUpdateHandler,
  });

  // POST /api/projects/:pid/tasks/bulk-delete
  fastify.route({
    method: "POST",
    url: "/projects/:pid/tasks/bulk-delete",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(BulkDeleteSchema),
    ],
    handler: bulkDeleteHandler,
  });

  // GET /api/tasks/:tid/activity
  fastify.route({
    method: "GET",
    url: "/tasks/:tid/activity",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER", "VIEWER"),
      validateQuery(ActivityLogQuerySchema),
    ],
    handler: listActivityHandler,
  });

  // POST /api/tasks/:tid/dependencies
  fastify.route({
    method: "POST",
    url: "/tasks/:tid/dependencies",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(TaskDependencySchema),
    ],
    handler: addDependencyHandler,
  });

  // POST /api/tasks/:tid/duplicate
  fastify.route({
    method: "POST",
    url: "/tasks/:tid/duplicate",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: duplicateTaskHandler,
  });

  // DELETE /api/tasks/:tid/dependencies/:depId
  fastify.route({
    method: "DELETE",
    url: "/tasks/:tid/dependencies/:depId",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: removeDependencyHandler,
  });
}
