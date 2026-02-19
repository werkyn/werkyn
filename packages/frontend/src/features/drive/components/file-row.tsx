import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { DriveFile } from "../api";
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

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `drag-${file.id}`,
    data: { id: file.id, type: "file", file },
    disabled: !canEdit,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${file.id}`,
    data: { id: file.id, type: "folder" },
    disabled: !file.isFolder,
  });

  return (
    <tr
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      className={cn(
        "border-b hover:bg-accent/50 transition-colors cursor-default",
        isDragging && "opacity-50",
        isOver && file.isFolder && "bg-primary/10 ring-1 ring-primary",
      )}
      onDoubleClick={() => file.isFolder && onNavigate(file.id)}
      {...(canEdit ? { ...listeners, ...attributes } : {})}
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
