import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download, Pencil, FolderInput, Trash2, RotateCcw, XCircle } from "lucide-react";
import type { DriveFile } from "../api";

interface FileActionMenuProps {
  file: DriveFile;
  isTrash?: boolean;
  onDownload?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onTrash?: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
}

export function FileActionMenu({
  file,
  isTrash,
  onDownload,
  onRename,
  onMove,
  onTrash,
  onRestore,
  onDeletePermanently,
}: FileActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Actions for ${file.name}`}
          className="rounded-md p-1 hover:bg-accent transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isTrash ? (
          <>
            <DropdownMenuItem onClick={onRestore}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDeletePermanently}
              className="text-destructive focus:text-destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Delete permanently
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {!file.isFolder && onDownload && (
              <DropdownMenuItem onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
            )}
            {onRename && (
              <DropdownMenuItem onClick={onRename}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
            )}
            {onMove && (
              <DropdownMenuItem onClick={onMove}>
                <FolderInput className="mr-2 h-4 w-4" />
                Move to...
              </DropdownMenuItem>
            )}
            {onTrash && (
              <DropdownMenuItem
                onClick={onTrash}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Move to Trash
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
