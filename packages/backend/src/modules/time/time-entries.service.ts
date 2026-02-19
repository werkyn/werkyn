import type { PrismaClient, WorkspaceRole } from "@prisma/client";
import type { CreateTimeEntryInput, UpdateTimeEntryInput, TimeEntryQuery } from "@pm/shared";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";

export async function createEntry(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  data: CreateTimeEntryInput,
) {
  let projectId = data.projectId ?? null;

  // Auto-populate projectId from task if taskId provided
  if (data.taskId && !projectId) {
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      select: { projectId: true },
    });
    if (task) {
      projectId = task.projectId;
    }
  }

  return prisma.timeEntry.create({
    data: {
      workspaceId,
      userId,
      date: data.date,
      hours: data.hours,
      description: data.description ?? null,
      taskId: data.taskId ?? null,
      projectId,
      billable: data.billable ?? true,
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true, color: true } },
    },
  });
}

export async function updateEntry(
  prisma: PrismaClient,
  entryId: string,
  userId: string,
  role: WorkspaceRole,
  data: UpdateTimeEntryInput,
) {
  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
  });
  if (!entry) throw new NotFoundError("Time entry not found");

  if (role !== "ADMIN" && entry.userId !== userId) {
    throw new ForbiddenError("You can only edit your own time entries");
  }

  let projectId = data.projectId;
  // Auto-populate projectId from task if taskId changes
  if (data.taskId !== undefined && data.taskId && projectId === undefined) {
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      select: { projectId: true },
    });
    if (task) {
      projectId = task.projectId;
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.date !== undefined) updateData.date = data.date;
  if (data.hours !== undefined) updateData.hours = data.hours;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.taskId !== undefined) updateData.taskId = data.taskId;
  if (projectId !== undefined) updateData.projectId = projectId;
  if (data.billable !== undefined) updateData.billable = data.billable;

  return prisma.timeEntry.update({
    where: { id: entryId },
    data: updateData,
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true, color: true } },
    },
  });
}

export async function deleteEntry(
  prisma: PrismaClient,
  entryId: string,
  userId: string,
  role: WorkspaceRole,
) {
  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
  });
  if (!entry) throw new NotFoundError("Time entry not found");

  if (role !== "ADMIN" && entry.userId !== userId) {
    throw new ForbiddenError("You can only delete your own time entries");
  }

  return prisma.timeEntry.delete({ where: { id: entryId } });
}

export async function listEntries(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
  query: TimeEntryQuery,
) {
  // Non-admins can only see their own entries
  const filterUserId = role === "ADMIN" && query.userId
    ? query.userId
    : role === "ADMIN"
      ? undefined
      : userId;

  return prisma.timeEntry.findMany({
    where: {
      workspaceId,
      ...(filterUserId ? { userId: filterUserId } : {}),
      date: {
        gte: query.startDate,
        lte: query.endDate,
      },
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true, color: true } },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
}
