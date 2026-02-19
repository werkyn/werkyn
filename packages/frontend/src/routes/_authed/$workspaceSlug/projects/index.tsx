import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ProjectsHome } from "@/features/projects/components/projects-home";

export const Route = createFileRoute(
  "/_authed/$workspaceSlug/projects/",
)({
  component: ProjectsRoute,
});

function ProjectsRoute() {
  const { workspaceSlug } = Route.useParams();

  const workspaces = useAuthStore((s) => s.workspaces);
  const workspace = workspaces.find(
    (w) => w.workspace.slug === workspaceSlug,
  )?.workspace;

  if (!workspace) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <ProjectsHome
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
    />
  );
}
