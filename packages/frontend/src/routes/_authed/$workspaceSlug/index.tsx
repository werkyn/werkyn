import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { usePermissions } from "@/hooks/use-permissions";
import { useDashboard } from "@/features/dashboard/api";
import { ProjectGrid } from "@/features/dashboard/components/project-grid";
import { MyTasksWidget } from "@/features/dashboard/components/my-tasks-widget";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";

export const Route = createFileRoute("/_authed/$workspaceSlug/")({
  component: WorkspaceDashboard,
});

function WorkspaceDashboard() {
  const { workspaceSlug } = Route.useParams();
  const { workspace, membership } = Route.useRouteContext();
  const user = useAuthStore((s) => s.user);
  const permissions = usePermissions(membership, user?.id);
  const [createOpen, setCreateOpen] = useState(false);

  const workspaceId = workspace?.id ?? "";

  useWorkspaceRealtime(workspaceId);

  const { data, isLoading } = useDashboard(workspaceId);
  const projects = data?.data ?? [];

  if (!workspace) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user?.displayName}
          </p>
        </div>
        {permissions.canCreate && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New project
          </Button>
        )}
      </div>

      <MyTasksWidget workspaceId={workspaceId} workspaceSlug={workspaceSlug} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-lg border bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : (
        <ProjectGrid
          projects={projects}
          workspaceSlug={workspaceSlug}
          canCreate={permissions.canCreate}
          onCreateProject={() => setCreateOpen(true)}
        />
      )}

      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}
