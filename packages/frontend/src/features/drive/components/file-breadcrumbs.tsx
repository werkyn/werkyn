import { useBreadcrumbs } from "../api";
import { ArrowLeft, ChevronRight } from "lucide-react";

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
      // We're at team folder root — go back to Drive root
      onNavigate(undefined, undefined);
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

  return (
    <div className="flex items-center gap-1 text-sm min-w-0">
      {(folderId || teamFolderId) && (
        <button
          onClick={handleBack}
          className="shrink-0 rounded-md p-1 hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}

      <button
        onClick={() => onNavigate(undefined, undefined)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        Drive
      </button>

      {/* Team folder name crumb */}
      {teamFolderId && teamFolderName && (
        <span className="flex items-center gap-1 min-w-0">
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          {displayCrumbs.length === 0 ? (
            <span className="truncate font-medium">{teamFolderName}</span>
          ) : (
            <button
              onClick={() => {
                // Navigate to team folder root
                if (crumbs.length > 0) {
                  onNavigate(crumbs[0].id, teamFolderId);
                }
              }}
              className="truncate text-muted-foreground hover:text-foreground transition-colors"
            >
              {teamFolderName}
            </button>
          )}
        </span>
      )}

      {/* Sub-folder crumbs */}
      {displayCrumbs.map((crumb, i) => (
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
      ))}
    </div>
  );
}
