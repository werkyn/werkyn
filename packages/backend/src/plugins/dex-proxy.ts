import fp from "fastify-plugin";
import replyFrom from "@fastify/reply-from";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { dexManager } from "../services/dex-manager.js";

export default fp(async function dexProxy(app: FastifyInstance) {
  await app.register(replyFrom, {
    base: `http://127.0.0.1:${env.DEX_INTERNAL_PORT}`,
    undici: { connections: 10, pipelining: 1 },
  });

  app.all("/dex/*", async (request, reply) => {
    if (!dexManager.isRunning) {
      return reply.code(503).send({ error: "SSO service is not running" });
    }

    const upstream = request.url;

    return reply.from(upstream, {
      rewriteRequestHeaders: (_req, headers) => {
        const { authorization, ...rest } = headers;
        return rest;
      },
    });
  });

  app.all("/dex", async (request, reply) => {
    if (!dexManager.isRunning) {
      return reply.code(503).send({ error: "SSO service is not running" });
    }

    return reply.from(request.url, {
      rewriteRequestHeaders: (_req, headers) => {
        const { authorization, ...rest } = headers;
        return rest;
      },
    });
  });
});
