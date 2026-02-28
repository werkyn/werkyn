import type { DriveFile } from "../api";
import { useFileDragDrop } from "../hooks/use-file-drag-drop";
import { getFileIcon, formatFileSize } from "@/lib/file-icons";
import { FileActionMenu } from "./file-action-menu";
import { cn } from "@/lib/utils";

interface FileCardProps {
  file: DriveFile;
  canEdit: boolean;
  onNavigate: (folderId: string) => void;
  onDownload: (file: DriveFile) => void;
  onRename: (file: DriveFile) => void;
  onMove: (file: DriveFile) => void;
  onTrash: (file: DriveFile) => void;
}

export function FileCard({
  file,
  canEdit,
  onNavigate,
  onDownload,
  onRename,
  onMove,
  onTrash,
}: FileCardProps) {
  const Icon = getFileIcon(file.mimeType, file.isFolder);
  const { attributes, listeners, setNodeRef, isDragging, isOver } = useFileDragDrop(file, canEdit);

  return (
    <div
      ref={setNodeRef}
      {...(canEdit ? { ...listeners, ...attributes } : {})}
      tabIndex={0}
      className={cn(
        "group relative flex flex-col items-center rounded-lg border p-4 hover:bg-accent/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
        file.isFolder ? "cursor-pointer" : "cursor-default",
        isDragging && "opacity-50",
        isOver && file.isFolder && "ring-2 ring-primary bg-primary/5",
      )}
      onClick={() => file.isFolder && onNavigate(file.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (file.isFolder) onNavigate(file.id);
        }
      }}
    >
      {canEdit && (
        <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <FileActionMenu
            file={file}
            onDownload={() => onDownload(file)}
            onRename={() => onRename(file)}
            onMove={() => onMove(file)}
            onTrash={() => onTrash(file)}
          />
        </div>
      )}

      <Icon className="h-12 w-12 text-muted-foreground mb-2" />

      <span className="text-sm truncate w-full text-center" title={file.name}>
        {file.name}
      </span>

      {!file.isFolder && (
        <span className="text-xs text-muted-foreground mt-0.5">
          {formatFileSize(file.size)}
        </span>
      )}
    </div>
  );
}
