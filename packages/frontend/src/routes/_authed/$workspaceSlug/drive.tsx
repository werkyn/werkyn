import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { DrivePage } from "@/features/drive/components/drive-page";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";
import { useWorkspaceSettings } from "@/features/admin/api";

const driveSearchSchema = z.object({
  folderId: z.string().optional(),
  teamFolderId: z.string().optional(),
  view: z.enum(["list", "grid"]).optional().default("list"),
  trash: z.coerce.boolean().optional().default(false),
});

export const Route = createFileRoute("/_authed/$workspaceSlug/drive")({
  validateSearch: driveSearchSchema,
  component: DriveRoute,
});

function DriveRoute() {
  const { workspaceSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const navTo = useNavigate();

  const workspaces = useAuthStore((s) => s.workspaces);
  const workspace = workspaces.find(
    (w) => w.workspace.slug === workspaceSlug,
  )?.workspace;

  const { data: settingsData } = useWorkspaceSettings(workspace?.id ?? "");
  const enabledModules = settingsData?.data?.enabledModules;

  useEffect(() => {
    if (enabledModules && !enabledModules.includes("drive")) {
      navTo({ to: "/$workspaceSlug", params: { workspaceSlug } });
    }
  }, [enabledModules, navTo, workspaceSlug]);

  useWorkspaceRealtime(workspace?.id);

  if (enabledModules && !enabledModules.includes("drive")) {
    return null;
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DrivePage
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      folderId={search.folderId}
      teamFolderId={search.teamFolderId}
      view={search.view}
      trash={search.trash}
      onNavigate={(folderId, teamFolderId) => {
        navigate({
          search: (prev) => ({
            ...prev,
            folderId,
            teamFolderId,
            trash: false,
          }),
        });
      }}
      onViewChange={(view) => {
        navigate({
          search: (prev) => ({ ...prev, view }),
        });
      }}
      onTrashToggle={(trash) => {
        navigate({
          search: (prev) => ({
            ...prev,
            trash,
            folderId: undefined,
            teamFolderId: undefined,
          }),
        });
      }}
    />
  );
}
