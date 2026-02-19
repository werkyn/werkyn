import type { PrismaClient, NotificationType, Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { createNotifications } from "../modules/notifications/notifications.service.js";

interface NotifyOptions {
  recipients: string[];
  type: NotificationType;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
  excludeUserId?: string;
}

export async function notify(
  prisma: PrismaClient,
  fastify: FastifyInstance,
  options: NotifyOptions,
) {
  const { recipients, type, title, body, data, excludeUserId } = options;

  // Filter out the actor
  const targetUserIds = excludeUserId
    ? recipients.filter((id) => id !== excludeUserId)
    : recipients;

  if (targetUserIds.length === 0) return;

  const notifications = targetUserIds.map((userId) => ({
    userId,
    type,
    title,
    body,
    data,
  }));

  const created = await createNotifications(prisma, notifications);

  // Push real-time notification to each recipient
  for (const notification of created) {
    fastify.broadcastToUser(notification.userId, "notification_new", notification);
  }
}
