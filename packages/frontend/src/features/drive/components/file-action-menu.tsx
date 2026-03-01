import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download, Pencil, FolderInput, Copy, Star, Share2, Trash2, RotateCcw, XCircle } from "lucide-react";
import type { DriveFile } from "../api";

interface FileMenuItemsProps {
  file: DriveFile;
  isTrash?: boolean;
  ItemComponent: React.ComponentType<{ onClick?: () => void; className?: string; children: React.ReactNode }>;
  SeparatorComponent?: React.ComponentType<{ className?: string }>;
  onShare?: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onCopy?: () => void;
  onStar?: () => void;
  onTrash?: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
}

export function FileMenuItems({
  file,
  isTrash,
  ItemComponent,
  SeparatorComponent,
  onShare,
  onDownload,
  onRename,
  onMove,
  onCopy,
  onStar,
  onTrash,
  onRestore,
  onDeletePermanently,
}: FileMenuItemsProps) {
  if (isTrash) {
    return (
      <>
        <ItemComponent onClick={onRestore}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Restore
        </ItemComponent>
        <ItemComponent
          onClick={onDeletePermanently}
          className="text-destructive focus:text-destructive"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Delete permanently
        </ItemComponent>
      </>
    );
  }

  return (
    <>
      {onShare && (
        <ItemComponent onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </ItemComponent>
      )}
      {!file.isFolder && onDownload && (
        <ItemComponent onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </ItemComponent>
      )}
      {onRename && (
        <ItemComponent onClick={onRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </ItemComponent>
      )}
      {onMove && (
        <ItemComponent onClick={onMove}>
          <FolderInput className="mr-2 h-4 w-4" />
          Move to...
        </ItemComponent>
      )}
      {!file.isFolder && onCopy && (
        <ItemComponent onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to...
        </ItemComponent>
      )}
      {onStar && (
        <ItemComponent onClick={onStar}>
          <Star className="mr-2 h-4 w-4" />
          {file.starred ? "Unstar" : "Star"}
        </ItemComponent>
      )}
      {(onTrash && (onDownload || onRename || onMove || onCopy || onStar)) && SeparatorComponent && (
        <SeparatorComponent />
      )}
      {onTrash && (
        <ItemComponent
          onClick={onTrash}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Move to Trash
        </ItemComponent>
      )}
    </>
  );
}

interface FileActionMenuProps {
  file: DriveFile;
  isTrash?: boolean;
  onShare?: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onCopy?: () => void;
  onStar?: () => void;
  onTrash?: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
}

export function FileActionMenu({
  file,
  isTrash,
  onShare,
  onDownload,
  onRename,
  onMove,
  onCopy,
  onStar,
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
        <FileMenuItems
          file={file}
          isTrash={isTrash}
          ItemComponent={DropdownMenuItem}
          SeparatorComponent={DropdownMenuSeparator}
          onShare={onShare}
          onDownload={onDownload}
          onRename={onRename}
          onMove={onMove}
          onCopy={onCopy}
          onStar={onStar}
          onTrash={onTrash}
          onRestore={onRestore}
          onDeletePermanently={onDeletePermanently}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
