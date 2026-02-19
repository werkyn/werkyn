import type { FastifyInstance } from "fastify";
import {
  listCommentsHandler,
  createCommentHandler,
  updateCommentHandler,
  deleteCommentHandler,
} from "./comments.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate, validateQuery } from "../../middleware/validate.js";
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  CommentQuerySchema,
} from "./comments.schemas.js";

export default async function commentsRoutes(fastify: FastifyInstance) {
  // GET /api/tasks/:tid/comments
  fastify.route({
    method: "GET",
    url: "/tasks/:tid/comments",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER", "VIEWER"),
      validateQuery(CommentQuerySchema),
    ],
    handler: listCommentsHandler,
  });

  // POST /api/tasks/:tid/comments
  fastify.route({
    method: "POST",
    url: "/tasks/:tid/comments",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(CreateCommentSchema),
    ],
    handler: createCommentHandler,
  });

  // PATCH /api/comments/:id
  fastify.route({
    method: "PATCH",
    url: "/comments/:id",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER"),
      validate(UpdateCommentSchema),
    ],
    handler: updateCommentHandler,
  });

  // DELETE /api/comments/:id
  fastify.route({
    method: "DELETE",
    url: "/comments/:id",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER")],
    handler: deleteCommentHandler,
  });
}
