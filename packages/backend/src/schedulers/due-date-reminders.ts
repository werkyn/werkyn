import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { notify } from "../utils/notify.js";

const DEFAULT_TIMING = "1_day_before";

/** Map timing preference → number of days before due date */
const TIMING_TO_DAYS: Record<string, number> = {
  on_due_date: 0,
  "1_day_before": 1,
  "3_days_before": 3,
  "1_week_before": 7,
};

function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function processDueDateReminders(
  prisma: PrismaClient,
  fastify: FastifyInstance,
) {
  const now = new Date();

  // Build the 4 target dates (UTC): today, +1, +3, +7
  const targetDates = Object.entries(TIMING_TO_DAYS).map(([timing, days]) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + days);
    return { timing, dateStr: formatDateUTC(d) };
  });

  const dateStrings = targetDates.map((t) => t.dateStr);

  // Query tasks with matching due dates that are not archived and not completed
  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { in: dateStrings },
      archived: false,
      status: { isCompletion: false },
    },
    include: {
      assignees: { select: { userId: true } },
      project: { select: { name: true, workspaceId: true } },
    },
  });

  if (tasks.length === 0) {
    fastify.log.info("Due-date reminders: 0 candidates");
    return;
  }

  // Collect all assignee user IDs
  const allUserIds = [...new Set(tasks.flatMap((t) => t.assignees.map((a) => a.userId)))];

  // Batch-fetch notification preferences
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: { in: allUserIds } },
  });
  const prefMap = new Map(prefs.map((p) => [p.userId, p]));

  // Build timing → dateStr lookup
  const timingToDate = new Map(targetDates.map((t) => [t.timing, t.dateStr]));

  // Determine which (task, user) pairs should receive a reminder
  const candidates: Array<{
    taskId: string;
    userId: string;
    dueDate: string;
    taskTitle: string;
    projectName: string;
    workspaceId: string;
  }> = [];

  for (const task of tasks) {
    for (const assignee of task.assignees) {
      const pref = prefMap.get(assignee.userId);

      // Skip if user disabled taskDueSoon
      if (pref && pref.taskDueSoon === false) continue;

      // Effective timing: task-level reminder > user pref > default
      const effectiveTiming =
        task.reminder || pref?.dueDateReminderTiming || DEFAULT_TIMING;

      // Check if this task's dueDate matches the target date for the effective timing
      const expectedDate = timingToDate.get(effectiveTiming);
      if (task.dueDate !== expectedDate) continue;

      candidates.push({
        taskId: task.id,
        userId: assignee.userId,
        dueDate: task.dueDate,
        taskTitle: task.title,
        projectName: task.project.name,
        workspaceId: task.project.workspaceId,
      });
    }
  }

  if (candidates.length === 0) {
    fastify.log.info("Due-date reminders: 0 candidates after filtering");
    return;
  }

  // Filter out already-sent reminders
  const alreadySent = await prisma.taskReminderSent.findMany({
    where: {
      OR: candidates.map((c) => ({
        taskId: c.taskId,
        userId: c.userId,
        dueDate: c.dueDate,
      })),
    },
    select: { taskId: true, userId: true, dueDate: true },
  });

  const sentSet = new Set(
    alreadySent.map((s) => `${s.taskId}:${s.userId}:${s.dueDate}`),
  );

  const toSend = candidates.filter(
    (c) => !sentSet.has(`${c.taskId}:${c.userId}:${c.dueDate}`),
  );

  if (toSend.length === 0) {
    fastify.log.info("Due-date reminders: all already sent");
    return;
  }

  // Record sent reminders (skipDuplicates as safety net)
  await prisma.taskReminderSent.createMany({
    data: toSend.map((c) => ({
      taskId: c.taskId,
      userId: c.userId,
      dueDate: c.dueDate,
    })),
    skipDuplicates: true,
  });

  // Send notifications
  const results = await Promise.allSettled(
    toSend.map((c) =>
      notify(prisma, fastify, {
        recipients: [c.userId],
        type: "TASK_DUE_SOON",
        title: `Task due soon: ${c.taskTitle}`,
        body: `"${c.taskTitle}" in ${c.projectName} is due on ${c.dueDate}`,
        data: {
          taskId: c.taskId,
          workspaceId: c.workspaceId,
          dueDate: c.dueDate,
        },
      }),
    ),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  fastify.log.info(
    `Due-date reminders: sent ${succeeded} notifications${failed > 0 ? `, ${failed} failed` : ""}`,
  );
}
