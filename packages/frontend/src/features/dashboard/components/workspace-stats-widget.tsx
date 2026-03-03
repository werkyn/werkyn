import { useDashboard } from "@/features/dashboard/api";
import { useWorkspaceMembers } from "@/features/workspaces/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/shared/progress-bar";
import { BarChart3 } from "lucide-react";

interface WorkspaceStatsWidgetProps {
  workspaceId: string;
}

export function WorkspaceStatsWidget({ workspaceId }: WorkspaceStatsWidgetProps) {
  const { data: dashData, isLoading: dashLoading } = useDashboard(workspaceId);
  const { data: membersData, isLoading: membersLoading } = useWorkspaceMembers(workspaceId);

  const isLoading = dashLoading || membersLoading;
  const projects = dashData?.data ?? [];
  const members = membersData?.data ?? [];

  const totalTasks = projects.reduce((s, p) => s + p.totalTasks, 0);
  const completedTasks = projects.reduce((s, p) => s + p.completedTasks, 0);
  const overdueTasks = projects.reduce((s, p) => s + p.overdueTasks, 0);
  const openTasks = totalTasks - completedTasks;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const topProjects = [...projects]
    .filter((p) => p.totalTasks > 0)
    .sort((a, b) => b.totalTasks - a.totalTasks)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Workspace Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {isLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-md" />
              ))}
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-lg font-semibold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-lg font-semibold">{projects.length}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-lg font-semibold">{openTasks}</p>
                <p className="text-xs text-muted-foreground">Open Tasks</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-lg font-semibold text-destructive">{overdueTasks}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Overall completion</span>
                <span className="font-medium">{completionPct}%</span>
              </div>
              <ProgressBar value={completionPct} />
            </div>

            {topProjects.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">By project</p>
                {topProjects.map((p) => {
                  const pct = Math.round((p.completedTasks / p.totalTasks) * 100);
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: p.color ?? "#6366f1" }}
                          />
                          <span className="truncate">{p.name}</span>
                        </div>
                        <span className="text-muted-foreground shrink-0 ml-2">
                          {p.completedTasks}/{p.totalTasks}
                        </span>
                      </div>
                      <ProgressBar value={pct} color={p.color ?? undefined} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
