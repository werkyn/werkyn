import { useState } from "react";
import { useStarredFiles, type DriveFile } from "../api";
import { getFileIcon } from "@/lib/file-icons";
import { ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarredSectionProps {
  workspaceId: string;
  onNavigate: (folderId: string, teamFolderId?: string) => void;
  onFileClick: (file: DriveFile) => void;
}

export function StarredSection({ workspaceId, onNavigate, onFileClick }: StarredSectionProps) {
  const { data } = useStarredFiles(workspaceId);
  const [collapsed, setCollapsed] = useState(false);

  const files = data?.data ?? [];
  if (files.length === 0) return null;

  return (
    <div className="px-4 pt-3 pb-1">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-1 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        <ChevronRight
          className={cn("h-3 w-3 transition-transform", !collapsed && "rotate-90")}
        />
        <Star className="h-3 w-3" />
        Starred
      </button>

      {!collapsed && (
        <div className="mt-1 space-y-0.5">
          {files.map((file) => {
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
