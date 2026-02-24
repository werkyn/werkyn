import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: (_req, context) => {
      const err = new Error(
        `Rate limit exceeded, retry in ${Math.ceil(context.ttl / 1000)} seconds`,
      );
      (err as Error & { statusCode: number }).statusCode = context.statusCode;
      return err;
    },
  });
});
