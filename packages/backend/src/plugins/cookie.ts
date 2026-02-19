import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(cookie, {
    secret: env.COOKIE_SECRET,
  });
});
