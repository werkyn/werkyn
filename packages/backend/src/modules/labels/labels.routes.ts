import type { FastifyInstance } from "fastify";
import {
  listLabelsHandler,
  createLabelHandler,
  updateLabelHandler,
  deleteLabelHandler,
} from "./labels.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { CreateLabelSchema, UpdateLabelSchema } from "./labels.schemas.js";

export default async function labelsRoutes(fastify: FastifyInstance) {
  // GET /api/projects/:pid/labels
  fastify.route({
    method: "GET",
    url: "/:pid/labels",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: listLabelsHandler,
  });

  // POST /api/projects/:pid/labels
  fastify.route({
    method: "POST",
    url: "/:pid/labels",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(CreateLabelSchema),
    ],
    handler: createLabelHandler,
  });

  // PATCH /api/projects/:pid/labels/:id
  fastify.route({
    method: "PATCH",
    url: "/:pid/labels/:id",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(UpdateLabelSchema),
    ],
    handler: updateLabelHandler,
  });

  // DELETE /api/projects/:pid/labels/:id
  fastify.route({
    method: "DELETE",
    url: "/:pid/labels/:id",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: deleteLabelHandler,
  });
}
