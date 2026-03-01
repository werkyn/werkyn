import type { DriveFile, SortBy, SortOrder } from "../api";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { FileCard } from "./file-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileGridViewProps {
  files: DriveFile[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  canEdit: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  anySelected?: boolean;
  onSelect?: (file: DriveFile, event: React.MouseEvent) => void;
  onLoadMore: () => void;
  onNavigate: (folderId: string) => void;
  onFileClick?: (file: DriveFile) => void;
  onDownload: (file: DriveFile) => void;
  onRename: (file: DriveFile) => void;
  onMove: (file: DriveFile) => void;
  onTrash: (file: DriveFile) => void;
  onCopy?: (file: DriveFile) => void;
  onStar?: (file: DriveFile) => void;
  onShare?: (file: DriveFile) => void;
  onArchive?: (file: DriveFile) => void;
  sharedFileIds?: Set<string>;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  onSort?: (column: SortBy) => void;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
  { value: "updatedAt", label: "Modified" },
  { value: "uploadedBy", label: "Uploaded by" },
];

export function FileGridView({
  files,
  hasNextPage,
  isFetchingNextPage,
  canEdit,
  selectable,
  selectedIds,
  anySelected,
  onSelect,
  onLoadMore,
  onNavigate,
  onFileClick,
  onDownload,
  onRename,
  onMove,
  onTrash,
  onCopy,
  onStar,
  onShare,
  onArchive,
  sharedFileIds,
  sortBy = "name",
  sortOrder = "asc",
  onSort,
}: FileGridViewProps) {
  const sentinelRef = useInfiniteScroll(hasNextPage, isFetchingNextPage, onLoadMore);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No files yet</p>
        <p className="text-xs mt-1">Upload files or create a folder to get started</p>
      </div>
    );
  }

  const activeLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Name";

  return (
    <div>
      <div className="flex items-center justify-end px-4 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <ArrowUpDown className="mr-1 h-3 w-3" />
              {activeLabel} ({sortOrder === "asc" ? "A-Z" : "Z-A"})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onSort?.(opt.value)}
              >
                {sortBy === opt.value && <Check className="mr-2 h-3 w-3" />}
                {sortBy !== opt.value && <span className="mr-2 w-3" />}
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-4">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            canEdit={canEdit}
            selectable={selectable}
            selected={selectedIds?.has(file.id)}
            anySelected={anySelected}
            onSelect={onSelect}
            onNavigate={onNavigate}
            onFileClick={onFileClick}
            onDownload={onDownload}
            onRename={onRename}
            onMove={onMove}
            onTrash={onTrash}
            onCopy={onCopy}
            onStar={onStar}
            onShare={onShare}
            onArchive={onArchive}
            isShared={sharedFileIds?.has(file.id)}
          />
        ))}
      </div>

      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}
