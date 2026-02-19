import { Link } from "@tanstack/react-router";
import type { DashboardProject } from "../api";
import { ProgressBar } from "@/components/shared/progress-bar";

interface ProjectCardProps {
  project: DashboardProject;
  workspaceSlug: string;
}

export function ProjectCard({ project, workspaceSlug }: ProjectCardProps) {
  const progress =
    project.totalTasks > 0
      ? Math.round((project.completedTasks / project.totalTasks) * 100)
      : 0;

  return (
    <Link
      to="/$workspaceSlug/projects/$projectId/board"
      params={{ workspaceSlug, projectId: project.id }}
      className="block rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-3 w-3 rounded-sm shrink-0"
          style={{ backgroundColor: project.color ?? "#6366f1" }}
        />
        <h3 className="font-medium text-sm truncate">{project.name}</h3>
        {project.archived && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            Archived
          </span>
        )}
      </div>

      <div className="space-y-2">
        <ProgressBar value={progress} />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {project.completedTasks}/{project.totalTasks} tasks
          </span>
          {project.overdueTasks > 0 && (
            <span className="text-destructive font-medium">
              {project.overdueTasks} overdue
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
