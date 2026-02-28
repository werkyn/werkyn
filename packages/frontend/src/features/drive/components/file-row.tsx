import type { DriveFile } from "../api";
import { useFileDragDrop } from "../hooks/use-file-drag-drop";
import { getFileIcon, formatFileSize } from "@/lib/file-icons";
import { timeAgo } from "@/lib/time-ago";
import { FileActionMenu } from "./file-action-menu";
import { cn } from "@/lib/utils";

interface FileRowProps {
  file: DriveFile;
  canEdit: boolean;
  onNavigate: (folderId: string) => void;
  onDownload: (file: DriveFile) => void;
  onRename: (file: DriveFile) => void;
  onMove: (file: DriveFile) => void;
  onTrash: (file: DriveFile) => void;
}

export function FileRow({
  file,
  canEdit,
  onNavigate,
  onDownload,
  onRename,
  onMove,
  onTrash,
}: FileRowProps) {
  const Icon = getFileIcon(file.mimeType, file.isFolder);
  const { attributes, listeners, setNodeRef, isDragging, isOver } = useFileDragDrop(file, canEdit);

  return (
    <tr
      ref={setNodeRef}
      {...(canEdit ? { ...listeners, ...attributes } : {})}
      tabIndex={0}
      className={cn(
        "border-b hover:bg-accent/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
        file.isFolder ? "cursor-pointer" : "cursor-default",
        isDragging && "opacity-50",
        isOver && file.isFolder && "bg-primary/10 ring-1 ring-primary",
      )}
      onClick={() => file.isFolder && onNavigate(file.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (file.isFolder) onNavigate(file.id);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement | null;
          next?.focus();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement | null;
          prev?.focus();
        }
      }}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm">{file.name}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground whitespace-nowrap">
        {file.isFolder ? "\u2014" : formatFileSize(file.size)}
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground whitespace-nowrap">
        {file.uploadedBy?.displayName ?? "\u2014"}
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground whitespace-nowrap">
        {timeAgo(file.updatedAt)}
      </td>
      <td className="px-3 py-2 text-right">
        {canEdit && (
          <FileActionMenu
            file={file}
            onDownload={() => onDownload(file)}
            onRename={() => onRename(file)}
            onMove={() => onMove(file)}
            onTrash={() => onTrash(file)}
          />
        )}
      </td>
    </tr>
  );
}
