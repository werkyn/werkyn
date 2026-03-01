import { useState } from "react";
import type { DriveFile } from "../api";
import type { RecentFileEntry } from "../hooks/use-recent-files";
import { getFileIcon } from "@/lib/file-icons";
import { ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentFilesSectionProps {
  recents: RecentFileEntry[];
  onNavigate: (folderId: string, teamFolderId?: string) => void;
  onFileClick: (file: DriveFile) => void;
}

const COLLAPSED_LIMIT = 5;

export function RecentFilesSection({ recents, onNavigate, onFileClick }: RecentFilesSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (recents.length === 0) return null;

  const visible = expanded ? recents : recents.slice(0, COLLAPSED_LIMIT);
  const hasMore = recents.length > COLLAPSED_LIMIT;

  return (
    <div className="px-4 pt-3 pb-1">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-1 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        <ChevronRight
          className={cn("h-3 w-3 transition-transform", !collapsed && "rotate-90")}
        />
        <Clock className="h-3 w-3" />
        Recent
      </button>

      {!collapsed && (
        <div className="mt-1 space-y-0.5">
          {visible.map((entry) => {
            const Icon = getFileIcon(entry.mimeType, entry.isFolder);
            return (
              <button
                key={entry.id}
                onClick={() => {
                  if (entry.isFolder) {
                    onNavigate(entry.id, entry.teamFolderId ?? undefined);
                  } else {
                    onFileClick(entry as unknown as DriveFile);
                  }
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{entry.name}</span>
              </button>
            );
          })}
          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? "Show less" : `Show ${recents.length - COLLAPSED_LIMIT} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
