import type { PrismaClient, NotificationType, Prisma } from "@prisma/client";
import type { NotificationQueryInput, UpdateNotificationPreferenceInput } from "@pm/shared";

const TYPE_TO_PREF_KEY: Record<NotificationType, string> = {
  TASK_ASSIGNED: "taskAssigned",
  TASK_STATUS_CHANGED: "taskStatusChanged",
  TASK_DUE_SOON: "taskDueSoon",
  COMMENT_ADDED: "commentAdded",
  COMMENT_MENTION: "commentMention",
};

export async function createNotification(
  prisma: PrismaClient,
  data: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Prisma.InputJsonValue;
  },
) {
  // Check user preference
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId: data.userId },
  });
  const prefKey = TYPE_TO_PREF_KEY[data.type];
  if (pref && prefKey in pref && !(pref as Record<string, unknown>)[prefKey]) {
    return null;
  }

  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data,
    },
  });
}

export async function createNotifications(
  prisma: PrismaClient,
  notifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Prisma.InputJsonValue;
  }>,
) {
  if (notifications.length === 0) return [];

  // Fetch preferences for all target users
  const userIds = [...new Set(notifications.map((n) => n.userId))];
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: { in: userIds } },
  });
  const prefMap = new Map(prefs.map((p) => [p.userId, p]));

  // Filter by preferences
  const filtered = notifications.filter((n) => {
    const pref = prefMap.get(n.userId);
    if (!pref) return true; // Default: all enabled
    const prefKey = TYPE_TO_PREF_KEY[n.type];
    return (pref as Record<string, unknown>)[prefKey] !== false;
  });

  if (filtered.length === 0) return [];

  // Create all notifications (use allSettled so one failure doesn't block all)
  const results = await Promise.allSettled(
    filtered.map((n) =>
      prisma.notification.create({
        data: {
          userId: n.userId,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data,
        },
      }),
    ),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof prisma.notification.create>>> => r.status === "fulfilled")
    .map((r) => r.value);
}

export async function listNotifications(
  prisma: PrismaClient,
  userId: string,
  query: NotificationQueryInput,
) {
  const take = query.limit + 1;
  const where: Record<string, unknown> = { userId };
  if (query.unreadOnly) {
    where.read = false;
  }

  let validCursor = query.cursor;
  if (validCursor) {
    const cursorExists = await prisma.notification.findUnique({
      where: { id: validCursor },
      select: { id: true },
    });
    if (!cursorExists) validCursor = undefined;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    ...(validCursor ? { cursor: { id: validCursor }, skip: 1 } : {}),
  });

  const hasMore = notifications.length > query.limit;
  const data = hasMore ? notifications.slice(0, query.limit) : notifications;
  const nextCursor = hasMore ? data[data.length - 1].id : undefined;

  return { data, nextCursor };
}

export async function getUnreadCount(
  prisma: PrismaClient,
  userId: string,
) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markNotificationsRead(
  prisma: PrismaClient,
  userId: string,
  notificationIds: string[],
) {
  await prisma.notification.updateMany({
    where: { id: { in: notificationIds }, userId },
    data: { read: true },
  });
}

export async function markAllRead(
  prisma: PrismaClient,
  userId: string,
) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function getNotificationPreference(
  prisma: PrismaClient,
  userId: string,
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function updateNotificationPreference(
  prisma: PrismaClient,
  userId: string,
  data: UpdateNotificationPreferenceInput,
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
