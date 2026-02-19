import type { FastifyInstance } from "fastify";
import {
  listNotificationsHandler,
  getUnreadCountHandler,
  markReadHandler,
  markAllReadHandler,
  getPreferenceHandler,
  updatePreferenceHandler,
} from "./notifications.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validate, validateQuery } from "../../middleware/validate.js";
import {
  NotificationQuerySchema,
  MarkNotificationsReadSchema,
  UpdateNotificationPreferenceSchema,
} from "@pm/shared";

export default async function notificationsRoutes(fastify: FastifyInstance) {
  // GET /api/notifications
  fastify.route({
    method: "GET",
    url: "/",
    preHandler: [authenticate, validateQuery(NotificationQuerySchema)],
    handler: listNotificationsHandler,
  });

  // GET /api/notifications/unread-count
  fastify.route({
    method: "GET",
    url: "/unread-count",
    preHandler: [authenticate],
    handler: getUnreadCountHandler,
  });

  // POST /api/notifications/mark-read
  fastify.route({
    method: "POST",
    url: "/mark-read",
    preHandler: [authenticate, validate(MarkNotificationsReadSchema)],
    handler: markReadHandler,
  });

  // POST /api/notifications/mark-all-read
  fastify.route({
    method: "POST",
    url: "/mark-all-read",
    preHandler: [authenticate],
    handler: markAllReadHandler,
  });

  // GET /api/notifications/preferences
  fastify.route({
    method: "GET",
    url: "/preferences",
    preHandler: [authenticate],
    handler: getPreferenceHandler,
  });

  // PATCH /api/notifications/preferences
  fastify.route({
    method: "PATCH",
    url: "/preferences",
    preHandler: [authenticate, validate(UpdateNotificationPreferenceSchema)],
    handler: updatePreferenceHandler,
  });
}
