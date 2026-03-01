import { useBreadcrumbs } from "../api";
import { ArrowLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileBreadcrumbsProps {
  workspaceId: string;
  folderId?: string;
  teamFolderId?: string;
  teamFolderName?: string;
  onNavigate: (folderId?: string, teamFolderId?: string) => void;
}

export function FileBreadcrumbs({
  workspaceId,
  folderId,
  teamFolderId,
  teamFolderName,
  onNavigate,
}: FileBreadcrumbsProps) {
  const { data } = useBreadcrumbs(workspaceId, folderId);
  const crumbs = data?.data ?? [];

  // When inside a team folder, the first crumb is the team folder root.
  // We skip it from the API breadcrumbs since we render teamFolderName ourselves.
  const displayCrumbs = teamFolderId && crumbs.length > 0
    ? crumbs.slice(1) // Skip the team folder root folder
    : crumbs;

  const handleBack = () => {
    if (teamFolderId && displayCrumbs.length === 0) {
      // We're at team folder root — stay here (sidebar navigates away)
      return;
    } else if (displayCrumbs.length > 0) {
      const parentIndex = displayCrumbs.length - 2;
      if (parentIndex >= 0) {
        onNavigate(displayCrumbs[parentIndex].id, teamFolderId);
      } else if (teamFolderId) {
        // Go back to team folder root
        onNavigate(crumbs[0]?.id, teamFolderId);
      } else {
        onNavigate(undefined, undefined);
      }
    }
  };

  const isInsideTeamFolder = !!teamFolderId;

  return (
    <div className="flex items-center gap-1 text-sm min-w-0">
      {/* Back button — only show when navigated into a subfolder */}
      {((isInsideTeamFolder && displayCrumbs.length > 0) || (!isInsideTeamFolder && folderId)) && (
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="shrink-0 rounded-md p-1 hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}

      {/* Root crumb: "Drive" for personal files, team folder name for team folders */}
      {isInsideTeamFolder && teamFolderName ? (
        <button
          onClick={() => {
            if (crumbs.length > 0) {
              onNavigate(crumbs[0].id, teamFolderId);
            }
          }}
          className={cn(
            "shrink-0 transition-colors",
            displayCrumbs.length === 0
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {teamFolderName}
        </button>
      ) : (
        <button
          onClick={() => onNavigate(undefined, undefined)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          Drive
        </button>
      )}

      {/* Sub-folder crumbs */}
      {displayCrumbs.length <= 3 ? (
        displayCrumbs.map((crumb, i) => (
          <span key={crumb.id} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            {i === displayCrumbs.length - 1 ? (
              <span className="truncate font-medium">{crumb.name}</span>
            ) : (
              <button
                onClick={() => onNavigate(crumb.id, teamFolderId)}
                className="truncate text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.name}
              </button>
            )}
          </span>
        ))
      ) : (
        <>
          {/* First crumb */}
          <span className="flex items-center gap-1 min-w-0">
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            <button
              onClick={() => onNavigate(displayCrumbs[0].id, teamFolderId)}
              className="truncate text-muted-foreground hover:text-foreground transition-colors"
            >
              {displayCrumbs[0].name}
            </button>
          </span>

          {/* Collapsed middle crumbs */}
          <span className="flex items-center gap-1 min-w-0">
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Show more breadcrumbs"
                  className="rounded p-0.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {displayCrumbs.slice(1, -2).map((crumb) => (
                  <DropdownMenuItem
                    key={crumb.id}
                    onClick={() => onNavigate(crumb.id, teamFolderId)}
                  >
                    {crumb.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </span>

          {/* Last 2 crumbs */}
          {displayCrumbs.slice(-2).map((crumb, i, arr) => (
            <span key={crumb.id} className="flex items-center gap-1 min-w-0">
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              {i === arr.length - 1 ? (
                <span className="truncate font-medium">{crumb.name}</span>
              ) : (
                <button
                  onClick={() => onNavigate(crumb.id, teamFolderId)}
                  className="truncate text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.name}
                </button>
              )}
            </span>
          ))}
        </>
      )}
    </div>
  );
}
