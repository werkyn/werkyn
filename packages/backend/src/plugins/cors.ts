import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN.split(","),
    credentials: true,
  });
});
