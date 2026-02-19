import type { FastifyInstance } from "fastify";
import {
  listTemplatesHandler,
  getTemplateHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  createTaskFromTemplateHandler,
} from "./templates.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { CreateTemplateSchema, UpdateTemplateSchema, InstantiateTemplateSchema } from "@pm/shared";

export default async function templatesRoutes(fastify: FastifyInstance) {
  // GET /api/projects/:pid/templates
  fastify.route({
    method: "GET",
    url: "/:pid/templates",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: listTemplatesHandler,
  });

  // POST /api/projects/:pid/templates
  fastify.route({
    method: "POST",
    url: "/:pid/templates",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(CreateTemplateSchema),
    ],
    handler: createTemplateHandler,
  });

  // GET /api/projects/:pid/templates/:templateId
  fastify.route({
    method: "GET",
    url: "/:pid/templates/:templateId",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: getTemplateHandler,
  });

  // PATCH /api/projects/:pid/templates/:templateId
  fastify.route({
    method: "PATCH",
    url: "/:pid/templates/:templateId",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(UpdateTemplateSchema),
    ],
    handler: updateTemplateHandler,
  });

  // DELETE /api/projects/:pid/templates/:templateId
  fastify.route({
    method: "DELETE",
    url: "/:pid/templates/:templateId",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: deleteTemplateHandler,
  });

  // POST /api/projects/:pid/templates/:templateId/create-task
  fastify.route({
    method: "POST",
    url: "/:pid/templates/:templateId/create-task",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(InstantiateTemplateSchema),
    ],
    handler: createTaskFromTemplateHandler,
  });
}
