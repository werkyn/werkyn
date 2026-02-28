import { PriorityBadge } from "@/components/shared/priority-badge";
import { DueDateChip } from "@/components/shared/due-date-chip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ListChecks } from "lucide-react";
import type { Task } from "@/features/tasks/api";

interface DragOverlayCardProps {
  task: Task;
}

export function DragOverlayCard({ task }: DragOverlayCardProps) {
  return (
    <div className="w-72 rounded-lg border border-primary/20 bg-card p-3 shadow-xl rotate-[2deg] scale-105 opacity-95 cursor-grabbing">
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((tl) => (
            <span
              key={tl.labelId}
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: tl.label.color }}
            >
              {tl.label.name}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {task.priority !== "NONE" && (
          <PriorityBadge priority={task.priority} />
        )}
        {task.dueDate && <DueDateChip dueDate={task.dueDate} />}
        {task._count.subtasks > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ListChecks className="h-3 w-3" />
            {task._count.subtasks}
          </span>
        )}
      </div>
      {task.assignees.length > 0 && (
        <div className="mt-2 flex -space-x-1">
          {task.assignees.slice(0, 3).map((a) => (
            <UserAvatar
              key={a.userId}
              displayName={a.user.displayName}
              avatarUrl={a.user.avatarUrl}
              size="sm"
              className="ring-2 ring-card"
            />
          ))}
          {task.assignees.length > 3 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-card">
              +{task.assignees.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
