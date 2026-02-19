import type { PrismaClient, Prisma } from "@prisma/client";

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface ActivityLogInput {
  taskId: string;
  actorId: string;
  action: string;
  details?: Prisma.JsonValue;
}

export async function logActivity(
  prisma: PrismaClient | PrismaTransactionClient,
  input: ActivityLogInput,
) {
  await prisma.activityLog.create({
    data: {
      taskId: input.taskId,
      actorId: input.actorId,
      action: input.action,
      details: input.details ?? undefined,
    },
  });
}
