import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { WikiHome } from "@/features/wiki/components/wiki-home";
import { WikiSpaceView } from "@/features/wiki/components/wiki-space-view";
import { WikiPageView } from "@/features/wiki/components/wiki-page-view";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";
import { useWorkspaceSettings } from "@/features/admin/api";

const wikiSearchSchema = z.object({
  spaceId: z.string().optional(),
  pageId: z.string().optional(),
});

export const Route = createFileRoute("/_authed/$workspaceSlug/knowledge")({
  validateSearch: wikiSearchSchema,
  component: WikiRoute,
});

function WikiRoute() {
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
    if (enabledModules && !enabledModules.includes("wiki")) {
      navTo({ to: "/$workspaceSlug", params: { workspaceSlug } });
    }
  }, [enabledModules, navTo, workspaceSlug]);

  useWorkspaceRealtime(workspace?.id);

  if (enabledModules && !enabledModules.includes("wiki")) {
    return null;
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const navigateToSpace = (spaceId: string) => {
    navigate({
      search: { spaceId, pageId: undefined },
    });
  };

  const navigateToPage = (pageId: string, spaceId?: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        pageId,
        ...(spaceId ? { spaceId } : {}),
      }),
    });
  };

  const navigateHome = () => {
    navigate({
      search: { spaceId: undefined, pageId: undefined },
    });
  };

  // Render page view
  if (search.pageId) {
    return (
      <WikiPageView
        pageId={search.pageId}
        workspaceId={workspace.id}
        onNavigatePage={(pgid) => navigateToPage(pgid)}
      />
    );
  }

  // Render space view
  if (search.spaceId) {
    return (
      <WikiSpaceView
        spaceId={search.spaceId}
        onPageClick={(pgid) => navigateToPage(pgid, search.spaceId)}
      />
    );
  }

  // Render wiki home
  return (
    <WikiHome
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      onSpaceClick={navigateToSpace}
    />
  );
}
