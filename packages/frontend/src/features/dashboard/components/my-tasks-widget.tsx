import { Link } from "@tanstack/react-router";
import { useMyTasks } from "@/features/my-tasks/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityVariant: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

interface MyTasksWidgetProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function MyTasksWidget({ workspaceId, workspaceSlug }: MyTasksWidgetProps) {
  const { data, isLoading } = useMyTasks(workspaceId);
  const tasks = data?.data ?? [];
  const displayTasks = tasks.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">My Tasks</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </div>
        ) : displayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No tasks assigned</p>
        ) : (
          <div className="space-y-2">
            {displayTasks.map((task) => (
              <Link
                key={task.id}
                to="/$workspaceSlug/projects/$projectId/board"
                params={{ workspaceSlug, projectId: task.projectId }}
                search={{ task: task.id }}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors -mx-2"
              >
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {task.project && (
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: task.project.color ?? "#6366f1" }}
                      title={task.project.name}
                    />
                  )}
                  <span className="truncate">{task.title}</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 border-0 shrink-0", priorityVariant[task.priority])}
                >
                  {task.priority[0] + task.priority.slice(1).toLowerCase()}
                </Badge>
                {task.dueDate && (
                  <span className={cn(
                    "text-xs shrink-0",
                    new Date(task.dueDate) < new Date() ? "text-destructive" : "text-muted-foreground",
                  )}>
                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
      {tasks.length > 0 && (
        <CardFooter className="pt-0">
          <Link
            to="/$workspaceSlug/my-tasks"
            params={{ workspaceSlug }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all tasks ({tasks.length})
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
