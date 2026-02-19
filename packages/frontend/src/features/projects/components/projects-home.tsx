import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "../api";
import { CreateProjectDialog } from "./create-project-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuthStore } from "@/stores/auth-store";

interface ProjectsHomeProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function ProjectsHome({ workspaceId, workspaceSlug }: ProjectsHomeProps) {
  const { data: projectsData, isLoading } = useProjects(workspaceId);
  const [createOpen, setCreateOpen] = useState(false);

  const workspaces = useAuthStore((s) => s.workspaces);
  const user = useAuthStore((s) => s.user);
  const membership = workspaces.find((w) => w.workspace.slug === workspaceSlug);
  const permissions = usePermissions(membership, user?.id);

  const projects = projectsData?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your team's work
          </p>
        </div>
        {permissions.canCreate && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Folder className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm">Create a project to start organizing your work.</p>
          {permissions.canCreate && (
            <Button onClick={() => setCreateOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              to="/$workspaceSlug/projects/$projectId/board"
              params={{ workspaceSlug, projectId: project.id }}
              className="flex flex-col rounded-lg border p-5 text-left hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="h-4 w-4 rounded-sm shrink-0"
                  style={{ backgroundColor: project.color ?? "#6366f1" }}
                />
                <h3 className="font-semibold text-lg">{project.name}</h3>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
              {project._count && (
                <p className="text-xs text-muted-foreground mt-auto pt-3">
                  {project._count.tasks} task{project._count.tasks !== 1 ? "s" : ""}
                  {" · "}
                  {project._count.members} member{project._count.members !== 1 ? "s" : ""}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}
