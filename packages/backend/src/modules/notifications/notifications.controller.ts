import type { FastifyRequest, FastifyReply } from "fastify";
import * as notificationsService from "./notifications.service.js";
import type { NotificationQueryInput, MarkNotificationsReadInput, UpdateNotificationPreferenceInput } from "@pm/shared";

export async function listNotificationsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = request.query as NotificationQueryInput;
  const result = await notificationsService.listNotifications(
    request.server.prisma,
    request.user!.id,
    query,
  );
  return reply.send(result);
}

export async function getUnreadCountHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const count = await notificationsService.getUnreadCount(
    request.server.prisma,
    request.user!.id,
  );
  return reply.send({ count });
}

export async function markReadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as MarkNotificationsReadInput;
  await notificationsService.markNotificationsRead(
    request.server.prisma,
    request.user!.id,
    body.notificationIds,
  );
  return reply.send({ success: true });
}

export async function markAllReadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await notificationsService.markAllRead(
    request.server.prisma,
    request.user!.id,
  );
  return reply.send({ success: true });
}

export async function getPreferenceHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const pref = await notificationsService.getNotificationPreference(
    request.server.prisma,
    request.user!.id,
  );
  return reply.send({ data: pref });
}

export async function updatePreferenceHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as UpdateNotificationPreferenceInput;
  const pref = await notificationsService.updateNotificationPreference(
    request.server.prisma,
    request.user!.id,
    body,
  );
  return reply.send({ data: pref });
}
