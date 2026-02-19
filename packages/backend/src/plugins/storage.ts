import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { LocalStorageProvider } from "../services/storage.js";
import type { StorageProvider } from "../services/storage.js";

declare module "fastify" {
  interface FastifyInstance {
    storage: StorageProvider;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const storage = new LocalStorageProvider(env.STORAGE_DIR);
  fastify.decorate("storage", storage);
});
