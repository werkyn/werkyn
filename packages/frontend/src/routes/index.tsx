import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const { accessToken, workspaces } = useAuthStore.getState();
    if (accessToken) {
      if (workspaces.length > 0) {
        throw redirect({
          to: "/$workspaceSlug",
          params: { workspaceSlug: workspaces[0].workspace.slug },
        });
      }
      throw redirect({ to: "/onboarding" as string });
    } else {
      throw redirect({ to: "/login" });
    }
  },
});
