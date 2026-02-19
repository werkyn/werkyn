import fp from "fastify-plugin";
import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE, // 10 GB default — also enforced in storage.saveStream()
    },
  });
});
