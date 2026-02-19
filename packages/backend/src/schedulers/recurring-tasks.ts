import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { createTaskFromTemplate } from "../modules/templates/templates.service.js";
import { advanceNextRunDate } from "../modules/recurring/recurring.service.js";

function todayUTC(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function processRecurringTasks(
  prisma: PrismaClient,
  fastify: FastifyInstance,
) {
  const today = todayUTC();

  // Find active configs where nextRunDate <= today and (no endDate or endDate >= today)
  const configs = await prisma.recurringTaskConfig.findMany({
    where: {
      isActive: true,
      nextRunDate: { lte: today },
      OR: [
        { endDate: null },
        { endDate: { gte: today } },
      ],
    },
    include: {
      project: { select: { id: true, archived: true, workspaceId: true } },
    },
  });

  if (configs.length === 0) {
    fastify.log.info("Recurring tasks: 0 configs due");
    return;
  }

  let created = 0;
  let failed = 0;

  for (const config of configs) {
    // Skip archived projects
    if (config.project.archived) continue;

    try {
      const task = await createTaskFromTemplate(
        prisma,
        config.projectId,
        config.templateId,
        null, // system-generated, no actor
        "ADMIN", // system acts as admin
      );

      fastify.broadcast(config.projectId, "task_created", { taskId: task.id });
      created++;
    } catch (err) {
      fastify.log.error(err, `Recurring task failed for config ${config.id}`);
      failed++;
    }

    // Advance nextRunDate
    const nextDate = advanceNextRunDate(
      config.frequency,
      config.nextRunDate,
      config.dayOfWeek,
      config.dayOfMonth,
    );

    // If next run exceeds endDate, deactivate
    const shouldDeactivate = config.endDate && nextDate > config.endDate;

    await prisma.recurringTaskConfig.update({
      where: { id: config.id },
      data: {
        nextRunDate: nextDate,
        ...(shouldDeactivate ? { isActive: false } : {}),
      },
    });
  }

  fastify.log.info(
    `Recurring tasks: created ${created} tasks${failed > 0 ? `, ${failed} failed` : ""}`,
  );
}
