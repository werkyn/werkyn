import pino from "pino";

/**
 * Standalone logger for non-request contexts (startup, mailer, etc.).
 * Uses the same log level as the Fastify request logger.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV === "development" && {
    transport: { target: "pino-pretty" },
  }),
});
