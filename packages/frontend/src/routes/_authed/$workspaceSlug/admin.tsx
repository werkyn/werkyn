import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { AdminPage } from "@/features/admin/components/admin-page";

export const Route = createFileRoute("/_authed/$workspaceSlug/admin")({
  beforeLoad: ({ params }) => {
    const { workspaces } = useAuthStore.getState();
    const membership = workspaces.find(
      (w) => w.workspace.slug === params.workspaceSlug,
    );
    if (!membership || membership.role !== "ADMIN") {
      throw redirect({
        to: "/$workspaceSlug",
        params: { workspaceSlug: params.workspaceSlug },
      });
    }
  },
  component: AdminPage,
});
