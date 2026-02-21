import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { EmailVerificationBanner } from "@/features/auth/components/email-verification-banner";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { useProjects } from "@/features/projects/api";
import { useWikiSpaces } from "@/features/wiki/api";
import { useWorkspaceSettings } from "@/features/admin/api";
import { useState, useEffect } from "react";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { useNotificationRealtime } from "@/hooks/use-notification-realtime";
import { useWikiRealtime } from "@/features/wiki/hooks/use-wiki-realtime";

export const Route = createFileRoute("/_authed/$workspaceSlug")({
  beforeLoad: ({ params }) => {
    const { workspaces } = useAuthStore.getState();
    const membership = workspaces.find(
      (w) => w.workspace.slug === params.workspaceSlug,
    );
    if (!membership) {
      throw redirect({ to: "/" });
    }
    return { workspace: membership.workspace, membership };
  },
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { workspace, membership } = Route.useRouteContext();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  useNotificationRealtime();

  // Guard against stale route context (e.g. after HMR or auth state changes)
  useEffect(() => {
    if (!workspace) {
      navigate({ to: "/" });
    }
  }, [workspace, navigate]);

  useWikiRealtime(workspace?.id);

  const workspaceId = workspace?.id ?? "";
  const { data: projectsData } = useProjects(workspaceId);
  const projects = projectsData?.data ?? [];
  const { data: wikiSpacesData } = useWikiSpaces(workspaceId);
  const wikiSpaces = wikiSpacesData?.data ?? [];
  const { data: settingsData } = useWorkspaceSettings(workspaceId);
  const enabledModules = settingsData?.data?.enabledModules ?? ["drive", "wiki", "time", "chat"];

  if (!workspace) return null;

  return (
    <RealtimeProvider>
      <div className="flex h-screen flex-col">
        <OfflineBanner />
        <EmailVerificationBanner />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            projects={projects}
            wikiSpaces={wikiSpaces}
            enabledModules={enabledModules}
            onCreateProject={() => setCreateOpen(true)}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-y-auto">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </main>
          </div>
        </div>
        <CreateProjectDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          workspaceId={workspace.id}
        />
      </div>
    </RealtimeProvider>
  );
}
