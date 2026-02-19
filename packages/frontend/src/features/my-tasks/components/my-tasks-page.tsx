import { useMyTasks, type MyTask } from "../api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MyTasksPageProps {
  workspaceId: string;
  workspaceSlug: string;
  onTaskClick: (taskId: string, projectId: string) => void;
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-blue-500 text-white",
};

export function MyTasksPage({
  workspaceId,
  workspaceSlug,
  onTaskClick,
}: MyTasksPageProps) {
  const { data, isLoading } = useMyTasks(workspaceId);
  const tasks = data?.data ?? [];

  // Group by project
  const grouped = tasks.reduce<Record<string, { project: { id: string; name: string; color: string | null }; tasks: MyTask[] }>>(
    (acc, task) => {
      const pid = task.project.id;
      if (!acc[pid]) {
        acc[pid] = { project: task.project, tasks: [] };
      }
      acc[pid].tasks.push(task);
      return acc;
    },
    {},
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-sm font-medium">No tasks assigned to you</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tasks you are assigned to will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Tasks</h1>

      {Object.entries(grouped).map(([pid, group]) => (
        <div key={pid} className="space-y-2">
          <div className="flex items-center gap-2 pb-1">
            <div
              className="h-3 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: group.project.color ?? "#6366f1" }}
            />
            <h2 className="text-sm font-semibold text-muted-foreground">
              {group.project.name}
            </h2>
          </div>

          <div className="space-y-1">
            {group.tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => onTaskClick(task.id, task.project.id)}
                className="flex w-full items-center gap-3 rounded-md border bg-card px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
              >
                <span className="flex-1 truncate">{task.title}</span>

                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5",
                    priorityColors[task.priority],
                  )}
                >
                  {task.priority}
                </Badge>

                {task.dueDate && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {task.dueDate}
                  </span>
                )}

                <Badge variant="outline" className="text-[10px] px-1.5">
                  {task.status.name}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
