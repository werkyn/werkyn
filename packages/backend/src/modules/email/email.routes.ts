import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/authenticate.js";
import { instanceAdmin } from "../../middleware/instance-admin.js";
import { validate } from "../../middleware/validate.js";
import { UpdateEmailConfigSchema } from "@pm/shared";
import {
  getEmailConfigHandler,
  updateEmailConfigHandler,
  sendTestEmailHandler,
} from "./email.controller.js";

export default async function emailRoutes(fastify: FastifyInstance) {
  // All routes require instance admin
  fastify.addHook("preHandler", authenticate);
  fastify.addHook("preHandler", instanceAdmin);

  // GET /api/admin/email/config
  fastify.route({
    method: "GET",
    url: "/config",
    handler: getEmailConfigHandler,
  });

  // PATCH /api/admin/email/config
  fastify.route({
    method: "PATCH",
    url: "/config",
    preHandler: [validate(UpdateEmailConfigSchema)],
    handler: updateEmailConfigHandler,
  });

  // POST /api/admin/email/test
  fastify.route({
    method: "POST",
    url: "/test",
    handler: sendTestEmailHandler,
  });
}
