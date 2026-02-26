import fp from "fastify-plugin";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default fp(async (fastify: FastifyInstance) => {
  const storageDir = path.resolve(env.STORAGE_DIR);

  // New storage-based avatar path
  await fastify.register(fastifyStatic, {
    root: path.join(storageDir, "avatars"),
    prefix: "/storage/avatars/",
    decorateReply: false,
  });

  // General uploads (wiki images, etc.)
  await fastify.register(fastifyStatic, {
    root: path.join(storageDir, "uploads"),
    prefix: "/storage/uploads/",
    decorateReply: false,
  });

  // Legacy uploads path (fallback for existing avatars)
  const legacyUploadsDir = path.join(__dirname, "../../uploads");
  await fastify.register(fastifyStatic, {
    root: legacyUploadsDir,
    prefix: "/uploads/",
    decorateReply: false,
  });

  // Serve frontend static assets in production
  if (env.NODE_ENV === "production") {
    const frontendDist = path.resolve(process.cwd(), "packages/frontend/dist");
    await fastify.register(fastifyStatic, {
      root: frontendDist,
      prefix: "/",
      decorateReply: false,
    });
  }
});
