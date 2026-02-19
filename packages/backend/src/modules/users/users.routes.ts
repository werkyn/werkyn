import type { FastifyInstance } from "fastify";
import {
  getMeHandler,
  updateProfileHandler,
  updateMeHandler,
  changePasswordHandler,
} from "./users.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { UpdateUserSchema, ChangePasswordSchema } from "@pm/shared";

export default async function usersRoutes(fastify: FastifyInstance) {
  // GET /api/users/me
  fastify.route({
    method: "GET",
    url: "/me",
    preHandler: [authenticate],
    handler: getMeHandler,
  });

  // PATCH /api/users/me
  fastify.route({
    method: "PATCH",
    url: "/me",
    preHandler: [authenticate, validate(UpdateUserSchema)],
    handler: updateMeHandler,
  });

  // PATCH /api/users/:id
  fastify.route({
    method: "PATCH",
    url: "/:id",
    preHandler: [authenticate, validate(UpdateUserSchema)],
    handler: updateProfileHandler,
  });

  // PATCH /api/users/:id/password
  fastify.route({
    method: "PATCH",
    url: "/:id/password",
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    preHandler: [authenticate, validate(ChangePasswordSchema)],
    handler: changePasswordHandler,
  });
}
