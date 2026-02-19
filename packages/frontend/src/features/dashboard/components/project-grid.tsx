import { ProjectCard } from "./project-card";
import type { DashboardProject } from "../api";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectGridProps {
  projects: DashboardProject[];
  workspaceSlug: string;
  canCreate: boolean;
  onCreateProject?: () => void;
}

export function ProjectGrid({
  projects,
  workspaceSlug,
  canCreate,
  onCreateProject,
}: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderPlus className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium">No projects yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first project to get started
        </p>
        {canCreate && onCreateProject && (
          <Button size="sm" className="mt-4" onClick={onCreateProject}>
            New project
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          workspaceSlug={workspaceSlug}
        />
      ))}
    </div>
  );
}
