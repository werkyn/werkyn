import type { PrismaClient } from "@prisma/client";
import type { BackupExportRequest, BackupFile } from "@pm/shared";

export async function exportBackup(
  prisma: PrismaClient,
  workspaceId: string,
  request: BackupExportRequest,
): Promise<BackupFile> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { name: true, slug: true },
  });

  // Collect all user IDs referenced across the backup
  const userIdSet = new Set<string>();

  // ─── Export Projects ──────────────────────────────────

  const projectEntries: BackupFile["projects"] = [];

  for (const opt of request.projects) {
    const project = await prisma.project.findUnique({
      where: { id: opt.projectId, workspaceId },
      select: {
        name: true,
        description: true,
        color: true,
        icon: true,
      },
    });
    if (!project) continue;

    const statuses = opt.includeStatuses
      ? await prisma.statusColumn.findMany({
          where: { projectId: opt.projectId },
          orderBy: { position: "asc" },
        })
      : [];

    const labels = opt.includeLabels
      ? await prisma.label.findMany({
          where: { projectId: opt.projectId },
        })
      : [];

    const customFields = opt.includeCustomFields
      ? await prisma.customField.findMany({
          where: { projectId: opt.projectId },
          orderBy: { position: "asc" },
        })
      : [];

    const members = opt.includeMembers
      ? await prisma.projectMember.findMany({
          where: { projectId: opt.projectId },
          select: { userId: true },
        })
      : [];

    for (const m of members) userIdSet.add(m.userId);

    // Tasks
    let tasks: BackupFile["projects"][number]["tasks"] = [];
    if (opt.includeTasks) {
      const dbTasks = await prisma.task.findMany({
        where: { projectId: opt.projectId },
        include: {
          assignees: { select: { userId: true } },
          labels: { select: { labelId: true } },
          subtasks: { orderBy: { position: "asc" } },
          customFieldValues: true,
          blockedBy: { select: { blockingTaskId: true } },
          comments: opt.includeComments
            ? { orderBy: { createdAt: "asc" } }
            : false,
          activities: opt.includeActivityLogs
            ? { orderBy: { createdAt: "asc" } }
            : false,
        },
        orderBy: { createdAt: "asc" },
      });

      tasks = dbTasks.map((t) => {
        for (const a of t.assignees) userIdSet.add(a.userId);
        for (const s of t.subtasks) {
          if (s.assigneeId) userIdSet.add(s.assigneeId);
        }

        const comments = t.comments
          ? t.comments.map((c) => {
              if (c.authorId) userIdSet.add(c.authorId);
              return {
                _originalId: c.id,
                body: c.body,
                authorRef: c.authorId,
                createdAt: c.createdAt.toISOString(),
              };
            })
          : [];

        const activityLogs = t.activities
          ? t.activities.map((a) => {
              if (a.actorId) userIdSet.add(a.actorId);
              return {
                _originalId: a.id,
                action: a.action,
                details: a.details,
                actorRef: a.actorId,
                createdAt: a.createdAt.toISOString(),
              };
            })
          : [];

        return {
          _originalId: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          position: t.position,
          dueDate: t.dueDate,
          startDate: t.startDate,
          statusRef: t.statusId,
          createdByRef: null as string | null,
          assignees: t.assignees.map((a) => a.userId),
          labels: t.labels.map((l) => l.labelId),
          subtasks: t.subtasks.map((s) => ({
            _originalId: s.id,
            title: s.title,
            completed: s.completed,
            position: s.position,
            assigneeRef: s.assigneeId,
            dueDate: s.dueDate,
          })),
          customFieldValues: t.customFieldValues.map((v) => ({
            fieldRef: v.fieldId,
            value: v.value,
          })),
          dependencies: t.blockedBy.map((d) => ({
            blockingTaskRef: d.blockingTaskId,
            type: "blocks",
          })),
          comments,
          activityLogs,
        };
      });
    }

    projectEntries.push({
      project: {
        name: project.name,
        description: project.description,
        color: project.color,
        icon: project.icon,
      },
      statuses: statuses.map((s) => ({
        _originalId: s.id,
        name: s.name,
        color: s.color,
        position: s.position,
        isCompletion: s.isCompletion,
      })),
      labels: labels.map((l) => ({
        _originalId: l.id,
        name: l.name,
        color: l.color,
      })),
      customFields: customFields.map((f) => ({
        _originalId: f.id,
        name: f.name,
        type: f.type,
        options: f.options,
        required: f.required,
        position: f.position,
      })),
      members: members.map((m) => ({ userRef: m.userId })),
      tasks,
    });
  }

  // ─── Export Channels ──────────────────────────────────

  const channelEntries: BackupFile["channels"] = [];

  for (const opt of request.channels) {
    const channel = await prisma.chatChannel.findUnique({
      where: { id: opt.channelId, workspaceId },
      select: {
        name: true,
        description: true,
        type: true,
        createdById: true,
      },
    });
    if (!channel || channel.type === "DM") continue;

    const members = opt.includeMembers
      ? await prisma.chatChannelMember.findMany({
          where: { channelId: opt.channelId },
          select: { userId: true },
        })
      : [];

    for (const m of members) userIdSet.add(m.userId);
    userIdSet.add(channel.createdById);

    let messages: BackupFile["channels"][number]["messages"] = [];
    if (opt.includeMessages) {
      const dbMessages = await prisma.chatMessage.findMany({
        where: { channelId: opt.channelId, deletedAt: null },
        include: opt.includeReactions
          ? { reactions: { select: { userId: true, emoji: true } } }
          : undefined,
        orderBy: { createdAt: "asc" },
      });

      messages = dbMessages.map((m) => {
        userIdSet.add(m.userId);
        const reactions = (m as any).reactions
          ? (m as any).reactions.map((r: any) => {
              userIdSet.add(r.userId);
              return { userRef: r.userId, emoji: r.emoji };
            })
          : [];

        return {
          _originalId: m.id,
          content: m.content,
          userRef: m.userId,
          parentRef: m.parentId,
          createdAt: m.createdAt.toISOString(),
          reactions,
        };
      });
    }

    channelEntries.push({
      channel: {
        name: channel.name,
        description: channel.description,
        type: channel.type as "PUBLIC" | "PRIVATE",
      },
      members: members.map((m) => ({ userRef: m.userId })),
      messages,
    });
  }

  // ─── Resolve User References ──────────────────────────

  const userRefs = await prisma.user.findMany({
    where: { id: { in: Array.from(userIdSet) } },
    select: { id: true, email: true, displayName: true },
  });

  return {
    metadata: {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      sourceWorkspace: { name: workspace.name, slug: workspace.slug },
      userRefs: userRefs.map((u) => ({
        originalId: u.id,
        email: u.email,
        displayName: u.displayName,
      })),
    },
    projects: projectEntries,
    channels: channelEntries,
  };
}
