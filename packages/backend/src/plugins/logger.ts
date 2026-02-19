import { env } from "../config/env.js";
import type { FastifyServerOptions } from "fastify";

export function getLoggerConfig(): FastifyServerOptions["logger"] {
  if (env.NODE_ENV === "development") {
    return {
      level: env.LOG_LEVEL,
      transport: {
        target: "pino-pretty",
      },
    };
  }

  return {
    level: env.LOG_LEVEL,
  };
}
