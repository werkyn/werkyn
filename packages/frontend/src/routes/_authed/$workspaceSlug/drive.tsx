import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { DrivePage } from "@/features/drive/components/drive-page";
import { DriveLayout } from "@/features/drive/components/drive-layout";
import { SharedWithMeView } from "@/features/drive/components/shared-with-me-view";
import { SharedByMeView } from "@/features/drive/components/shared-by-me-view";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";
import { useWorkspaceSettings } from "@/features/admin/api";
import type { DriveSection } from "@/features/drive/components/drive-sidebar";

const driveSearchSchema = z.object({
  folderId: z.string().optional(),
  teamFolderId: z.string().optional(),
  view: z.enum(["list", "grid"]).optional().default("list"),
  trash: z.coerce.boolean().optional().default(false),
  section: z
    .enum([
      "home",
      "drive",
      "shared-with-me",
      "shared-by-me",
      "recent",
      "starred",
      "trash",
    ])
    .optional()
    .default("home"),
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

  const section: DriveSection = search.trash ? "trash" : search.section;

  const handleSectionChange = (newSection: DriveSection) => {
    navigate({
      search: (prev) => ({
        ...prev,
        section: newSection,
        trash: newSection === "trash",
        folderId: undefined,
        teamFolderId: undefined,
      }),
    });
  };

  const handleTeamFolderClick = (folderId: string, teamFolderId: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        section: "drive" as const,
        folderId,
        teamFolderId,
        trash: false,
      }),
    });
  };

  const renderContent = () => {
    switch (section) {
      case "shared-with-me":
        return (
          <SharedWithMeView
            workspaceId={workspace.id}
            workspaceSlug={workspaceSlug}
          />
        );
      case "shared-by-me":
        return (
          <SharedByMeView
            workspaceId={workspace.id}
            workspaceSlug={workspaceSlug}
          />
        );
      case "starred":
        return (
          <DrivePage
            workspaceId={workspace.id}
            workspaceSlug={workspaceSlug}
            folderId={search.folderId}
            teamFolderId={search.teamFolderId}
            view={search.view}
            trash={false}
            section="starred"
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
              navigate({ search: (prev) => ({ ...prev, view }) });
            }}
            onTrashToggle={(trash) => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  trash,
                  section: trash ? ("trash" as const) : prev.section,
                  folderId: undefined,
                  teamFolderId: undefined,
                }),
              });
            }}
          />
        );
      case "recent":
        return (
          <DrivePage
            workspaceId={workspace.id}
            workspaceSlug={workspaceSlug}
            folderId={search.folderId}
            teamFolderId={search.teamFolderId}
            view={search.view}
            trash={false}
            section="recent"
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
              navigate({ search: (prev) => ({ ...prev, view }) });
            }}
            onTrashToggle={(trash) => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  trash,
                  section: trash ? ("trash" as const) : prev.section,
                  folderId: undefined,
                  teamFolderId: undefined,
                }),
              });
            }}
          />
        );
      default:
        return (
          <DrivePage
            workspaceId={workspace.id}
            workspaceSlug={workspaceSlug}
            folderId={search.folderId}
            teamFolderId={search.teamFolderId}
            view={search.view}
            trash={section === "trash"}
            section={section === "drive" ? "drive" : "home"}
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
              navigate({ search: (prev) => ({ ...prev, view }) });
            }}
            onTrashToggle={(trash) => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  trash,
                  section: trash ? ("trash" as const) : prev.section,
                  folderId: undefined,
                  teamFolderId: undefined,
                }),
              });
            }}
          />
        );
    }
  };

  return (
    <DriveLayout
      workspaceId={workspace.id}
      section={section}
      activeTeamFolderId={search.teamFolderId}
      onSectionChange={handleSectionChange}
      onTeamFolderClick={handleTeamFolderClick}
    >
      {renderContent()}
    </DriveLayout>
  );
}
