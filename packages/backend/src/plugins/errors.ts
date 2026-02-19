import fp from "fastify-plugin";
import type { FastifyInstance, FastifyError } from "fastify";
import { AppError, ValidationError, LockedError } from "../utils/errors.js";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export default fp(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler(
    (error: FastifyError | Error, request, reply) => {
      // Known application errors
      if (error instanceof AppError) {
        const response: Record<string, unknown> = {
          statusCode: error.statusCode,
          error: error.error,
          message: error.message,
        };
        if (error instanceof ValidationError && error.details) {
          response.details = error.details;
        }
        if (error instanceof LockedError) {
          reply.header("Retry-After", String(error.retryAfter));
        }
        return reply.status(error.statusCode).send(response);
      }

      // Zod validation errors
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Validation failed",
          details,
        });
      }

      // Fastify validation errors (from schema)
      if ("validation" in error && error.validation) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: error.message,
        });
      }

      // Unhandled errors
      request.log.error(error);

      if (env.NODE_ENV === "production") {
        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "An unexpected error occurred",
        });
      }

      return reply.status(500).send({
        statusCode: 500,
        error: "Internal Server Error",
        message: error.message,
        stack: error.stack,
      });
    },
  );
});
