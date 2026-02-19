import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });
});
