import type { FastifyInstance } from "fastify";
import {
  listCustomFieldsHandler,
  createCustomFieldHandler,
  updateCustomFieldHandler,
  deleteCustomFieldHandler,
  reorderCustomFieldsHandler,
  setFieldValueHandler,
} from "./custom-fields.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import {
  CreateCustomFieldSchema,
  UpdateCustomFieldSchema,
  ReorderCustomFieldsSchema,
  SetCustomFieldValueSchema,
} from "./custom-fields.schemas.js";

export default async function customFieldsRoutes(fastify: FastifyInstance) {
  // GET /api/projects/:pid/custom-fields
  fastify.route({
    method: "GET",
    url: "/:pid/custom-fields",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: listCustomFieldsHandler,
  });

  // POST /api/projects/:pid/custom-fields
  fastify.route({
    method: "POST",
    url: "/:pid/custom-fields",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(CreateCustomFieldSchema),
    ],
    handler: createCustomFieldHandler,
  });

  // PATCH /api/projects/:pid/custom-fields/reorder
  fastify.route({
    method: "PATCH",
    url: "/:pid/custom-fields/reorder",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(ReorderCustomFieldsSchema),
    ],
    handler: reorderCustomFieldsHandler,
  });

  // PATCH /api/projects/:pid/custom-fields/:id
  fastify.route({
    method: "PATCH",
    url: "/:pid/custom-fields/:id",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(UpdateCustomFieldSchema),
    ],
    handler: updateCustomFieldHandler,
  });

  // DELETE /api/projects/:pid/custom-fields/:id
  fastify.route({
    method: "DELETE",
    url: "/:pid/custom-fields/:id",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: deleteCustomFieldHandler,
  });

  // PUT /api/projects/:pid/tasks/:tid/custom-fields/:fieldId
  fastify.route({
    method: "PUT",
    url: "/:pid/tasks/:tid/custom-fields/:fieldId",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(SetCustomFieldValueSchema),
    ],
    handler: setFieldValueHandler,
  });
}
