import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/authenticate.js";
import { instanceAdmin } from "../../middleware/instance-admin.js";
import { validate } from "../../middleware/validate.js";
import {
  UpdateSsoConfigSchema,
  CreateSsoConnectorSchema,
  UpdateSsoConnectorSchema,
} from "@pm/shared";
import {
  getConfigHandler,
  updateConfigHandler,
  getConnectorsHandler,
  createConnectorHandler,
  updateConnectorHandler,
  deleteConnectorHandler,
} from "./sso.controller.js";

export default async function ssoRoutes(fastify: FastifyInstance) {
  // All routes require instance admin
  fastify.addHook("preHandler", authenticate);
  fastify.addHook("preHandler", instanceAdmin);

  // GET /api/admin/sso/config
  fastify.route({
    method: "GET",
    url: "/config",
    handler: getConfigHandler,
  });

  // PATCH /api/admin/sso/config
  fastify.route({
    method: "PATCH",
    url: "/config",
    preHandler: [validate(UpdateSsoConfigSchema)],
    handler: updateConfigHandler,
  });

  // GET /api/admin/sso/connectors
  fastify.route({
    method: "GET",
    url: "/connectors",
    handler: getConnectorsHandler,
  });

  // POST /api/admin/sso/connectors
  fastify.route({
    method: "POST",
    url: "/connectors",
    preHandler: [validate(CreateSsoConnectorSchema)],
    handler: createConnectorHandler,
  });

  // PATCH /api/admin/sso/connectors/:cid
  fastify.route({
    method: "PATCH",
    url: "/connectors/:cid",
    preHandler: [validate(UpdateSsoConnectorSchema)],
    handler: updateConnectorHandler,
  });

  // DELETE /api/admin/sso/connectors/:cid
  fastify.route({
    method: "DELETE",
    url: "/connectors/:cid",
    handler: deleteConnectorHandler,
  });
}
