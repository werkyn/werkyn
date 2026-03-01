import type { DriveFile } from "../api";
import { useFileDragDrop } from "../hooks/use-file-drag-drop";
import { getFileIcon, formatFileSize } from "@/lib/file-icons";
import { timeAgo } from "@/lib/time-ago";
import { FileActionMenu, FileMenuItems } from "./file-action-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Share2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileRowProps {
  file: DriveFile;
  canEdit: boolean;
  selectable?: boolean;
  selected?: boolean;
  anySelected?: boolean;
  onSelect?: (file: DriveFile, event: React.MouseEvent) => void;
  onNavigate: (folderId: string) => void;
  onFileClick?: (file: DriveFile) => void;
  onDownload: (file: DriveFile) => void;
  onRename: (file: DriveFile) => void;
  onMove: (file: DriveFile) => void;
  onTrash: (file: DriveFile) => void;
  onCopy?: (file: DriveFile) => void;
  onStar?: (file: DriveFile) => void;
  onShare?: (file: DriveFile) => void;
  isShared?: boolean;
}

export function FileRow({
  file,
  canEdit,
  selectable,
  selected,
  anySelected,
  onSelect,
  onNavigate,
  onFileClick,
  onDownload,
  onRename,
  onMove,
  onTrash,
  onCopy,
  onStar,
  onShare,
  isShared,
}: FileRowProps) {
  const Icon = getFileIcon(file.mimeType, file.isFolder);
  const { attributes, listeners, setNodeRef, isDragging, isOver } = useFileDragDrop(file, canEdit);

  const row = (
    <tr
      ref={setNodeRef}
      {...(canEdit ? { ...listeners, ...attributes } : {})}
      tabIndex={0}
      className={cn(
        "group/row border-b hover:bg-accent/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
        "cursor-pointer",
        isDragging && "opacity-50",
        isOver && file.isFolder && "bg-primary/10 ring-1 ring-primary",
        selected && "bg-primary/5",
      )}
      onClick={() => {
        if (file.isFolder) onNavigate(file.id);
        else onFileClick?.(file);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (file.isFolder) onNavigate(file.id);
          else onFileClick?.(file);
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
          {selectable ? (
            <div className="relative h-4 w-4 shrink-0">
              <Icon
                className={cn(
                  "absolute inset-0 h-4 w-4 text-muted-foreground transition-opacity",
                  anySelected ? "opacity-0" : "group-hover/row:opacity-0",
                )}
              />
              <input
                type="checkbox"
                checked={!!selected}
                onChange={() => {}}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(file, e as unknown as React.MouseEvent);
                }}
                className={cn(
                  "absolute inset-0 h-4 w-4 rounded border-input accent-primary cursor-pointer transition-opacity",
                  anySelected ? "opacity-100" : "opacity-0 group-hover/row:opacity-100",
                )}
              />
            </div>
          ) : (
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm">{file.name}</span>
          {isShared && (
            <Share2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          {onStar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStar(file);
              }}
              className={cn(
                "shrink-0 rounded p-0.5 transition-opacity",
                file.starred
                  ? "opacity-100 text-yellow-500"
                  : "opacity-0 group-hover/row:opacity-100 text-muted-foreground hover:text-yellow-500",
              )}
              title={file.starred ? "Unstar" : "Star"}
            >
              <Star className={cn("h-3.5 w-3.5", file.starred && "fill-current")} />
            </button>
          )}
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
            onShare={onShare ? () => onShare(file) : undefined}
            onDownload={() => onDownload(file)}
            onRename={() => onRename(file)}
            onMove={() => onMove(file)}
            onCopy={onCopy ? () => onCopy(file) : undefined}
            onStar={onStar ? () => onStar(file) : undefined}
            onTrash={() => onTrash(file)}
          />
        )}
      </td>
    </tr>
  );

  if (!canEdit) return row;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
      <ContextMenuContent>
        <FileMenuItems
          file={file}
          ItemComponent={ContextMenuItem}
          SeparatorComponent={ContextMenuSeparator}
          onShare={onShare ? () => onShare(file) : undefined}
          onDownload={() => onDownload(file)}
          onRename={() => onRename(file)}
          onMove={() => onMove(file)}
          onCopy={onCopy ? () => onCopy(file) : undefined}
          onStar={onStar ? () => onStar(file) : undefined}
          onTrash={() => onTrash(file)}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}
