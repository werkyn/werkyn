import { useState } from "react";
import { getFileIcon } from "@/lib/file-icons";
import { ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentFileEntry {
  id: string;
  name: string;
  mimeType: string | null;
  isFolder: boolean;
  teamFolderId?: string | null;
}

interface RecentFilesSectionProps {
  recents: RecentFileEntry[];
  onNavigate: (folderId: string, teamFolderId?: string) => void;
  onFileClick: (file: RecentFileEntry) => void;
}

export function RecentFilesSection({ recents, onNavigate, onFileClick }: RecentFilesSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (recents.length === 0) return null;

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
          {recents.map((file) => {
            const Icon = getFileIcon(file.mimeType, file.isFolder);
            return (
              <button
                key={file.id}
                onClick={() => {
                  if (file.isFolder) onNavigate(file.id, file.teamFolderId ?? undefined);
                  else onFileClick(file);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
