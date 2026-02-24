import type { FastifyInstance } from "fastify";
import {
  createInviteHandler,
  listInvitesHandler,
  revokeInviteHandler,
  getInviteHandler,
  acceptInviteHandler,
} from "./invites.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { CreateInviteSchema } from "./invites.schemas.js";

export default async function invitesRoutes(fastify: FastifyInstance) {
  // POST /api/workspaces/:wid/invites
  fastify.route({
    method: "POST",
    url: "/workspaces/:wid/invites",
    preHandler: [authenticate, authorize("ADMIN"), validate(CreateInviteSchema)],
    handler: createInviteHandler,
  });

  // GET /api/workspaces/:wid/invites
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/invites",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: listInvitesHandler,
  });

  // DELETE /api/invites/:id
  fastify.route({
    method: "DELETE",
    url: "/invites/:id",
    preHandler: [authenticate],
    handler: revokeInviteHandler,
  });

  // GET /api/invites/:token (public)
  fastify.route({
    method: "GET",
    url: "/invites/:token",
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    handler: getInviteHandler,
  });

  // POST /api/invites/:token/accept
  fastify.route({
    method: "POST",
    url: "/invites/:token/accept",
    preHandler: [authenticate],
    handler: acceptInviteHandler,
  });
}
