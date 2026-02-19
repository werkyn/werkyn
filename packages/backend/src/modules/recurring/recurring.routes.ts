import type { FastifyInstance } from "fastify";
import {
  listRecurringHandler,
  createRecurringHandler,
  updateRecurringHandler,
  deleteRecurringHandler,
} from "./recurring.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { CreateRecurringSchema, UpdateRecurringSchema } from "@pm/shared";

export default async function recurringRoutes(fastify: FastifyInstance) {
  // GET /api/projects/:pid/recurring
  fastify.route({
    method: "GET",
    url: "/:pid/recurring",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: listRecurringHandler,
  });

  // POST /api/projects/:pid/recurring
  fastify.route({
    method: "POST",
    url: "/:pid/recurring",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(CreateRecurringSchema),
    ],
    handler: createRecurringHandler,
  });

  // PATCH /api/projects/:pid/recurring/:configId
  fastify.route({
    method: "PATCH",
    url: "/:pid/recurring/:configId",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(UpdateRecurringSchema),
    ],
    handler: updateRecurringHandler,
  });

  // DELETE /api/projects/:pid/recurring/:configId
  fastify.route({
    method: "DELETE",
    url: "/:pid/recurring/:configId",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: deleteRecurringHandler,
  });
}
