import type { PrismaClient } from "@prisma/client";
import type { SetUserRateInput } from "@pm/shared";

export async function setRate(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  data: SetUserRateInput,
) {
  const effectiveFrom =
    data.effectiveFrom ?? new Date().toISOString().slice(0, 10);

  return prisma.userRate.upsert({
    where: {
      workspaceId_userId_effectiveFrom: {
        workspaceId,
        userId,
        effectiveFrom,
      },
    },
    create: {
      workspaceId,
      userId,
      rate: data.rate,
      currency: data.currency ?? "USD",
      effectiveFrom,
    },
    update: {
      rate: data.rate,
      ...(data.currency ? { currency: data.currency } : {}),
    },
  });
}

export async function getRate(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  date?: string,
) {
  const asOfDate = date ?? new Date().toISOString().slice(0, 10);

  return prisma.userRate.findFirst({
    where: {
      workspaceId,
      userId,
      effectiveFrom: { lte: asOfDate },
    },
    orderBy: { effectiveFrom: "desc" },
  });
}

export async function listRates(
  prisma: PrismaClient,
  workspaceId: string,
  userId?: string,
) {
  return prisma.userRate.findMany({
    where: {
      workspaceId,
      ...(userId ? { userId } : {}),
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: [{ userId: "asc" }, { effectiveFrom: "desc" }],
  });
}
