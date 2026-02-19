import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceSettings } from "@/features/admin/api";
import { useEffect } from "react";

export const Route = createFileRoute("/_authed/$workspaceSlug/time")({
  component: TimeLayout,
});

function TimeLayout() {
  const { workspaceSlug } = Route.useParams();
  const navigate = useNavigate();
  const workspaces = useAuthStore((s) => s.workspaces);
  const workspace = workspaces.find(
    (w) => w.workspace.slug === workspaceSlug,
  )?.workspace;
  const { data: settingsData } = useWorkspaceSettings(workspace?.id ?? "");
  const enabledModules = settingsData?.data?.enabledModules;

  useEffect(() => {
    if (enabledModules && !enabledModules.includes("time")) {
      navigate({ to: "/$workspaceSlug", params: { workspaceSlug } });
    }
  }, [enabledModules, navigate, workspaceSlug]);

  if (enabledModules && !enabledModules.includes("time")) {
    return null;
  }

  return <Outlet />;
}
