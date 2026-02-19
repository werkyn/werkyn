import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ProjectSettings } from "@/features/projects/components/project-settings";

export const Route = createFileRoute(
  "/_authed/$workspaceSlug/projects/$projectId/settings",
)({
  beforeLoad: ({ params }) => {
    const { workspaces } = useAuthStore.getState();
    const membership = workspaces.find(
      (w) => w.workspace.slug === params.workspaceSlug,
    );
    if (membership?.role !== "ADMIN") {
      throw redirect({
        to: "/$workspaceSlug/projects/$projectId",
        params: {
          workspaceSlug: params.workspaceSlug,
          projectId: params.projectId,
        },
      });
    }
  },
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const { projectId, workspaceSlug } = Route.useParams();

  return (
    <ProjectSettings projectId={projectId} workspaceSlug={workspaceSlug} />
  );
}
