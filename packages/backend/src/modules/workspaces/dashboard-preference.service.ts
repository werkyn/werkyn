import type { PrismaClient } from "@prisma/client";
import type { UpdateDashboardPreferenceInput } from "@pm/shared";

export async function getDashboardPreference(
  prisma: PrismaClient,
  userId: string,
  workspaceId: string,
) {
  return prisma.dashboardPreference.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
}

export async function updateDashboardPreference(
  prisma: PrismaClient,
  userId: string,
  workspaceId: string,
  data: UpdateDashboardPreferenceInput,
) {
  return prisma.dashboardPreference.upsert({
    where: { userId_workspaceId: { userId, workspaceId } },
    create: { userId, workspaceId, widgetOrder: data.widgetOrder },
    update: { widgetOrder: data.widgetOrder },
  });
}
