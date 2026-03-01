import type { DriveFile, SortBy, SortOrder } from "../api";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { FileRow } from "./file-row";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileListViewProps {
  files: DriveFile[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  canEdit: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  anySelected?: boolean;
  allSelected?: boolean;
  onToggleAll?: () => void;
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
  sharedFileIds?: Set<string>;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  onSort?: (column: SortBy) => void;
}

function SortIndicator({ column, sortBy, sortOrder }: { column: SortBy; sortBy?: SortBy; sortOrder?: SortOrder }) {
  if (column !== sortBy) return null;
  return sortOrder === "asc"
    ? <ChevronUp className="h-3 w-3" />
    : <ChevronDown className="h-3 w-3" />;
}

export function FileListView({
  files,
  hasNextPage,
  isFetchingNextPage,
  canEdit,
  selectable,
  selectedIds,
  anySelected,
  allSelected,
  onToggleAll,
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
  sharedFileIds,
  sortBy,
  sortOrder,
  onSort,
}: FileListViewProps) {
  const sentinelRef = useInfiniteScroll(hasNextPage, isFetchingNextPage, onLoadMore);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No files yet</p>
        <p className="text-xs mt-1">Upload files or create a folder to get started</p>
      </div>
    );
  }

  const sortableHeaderClass = "cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div>
      <table className="w-full">
        <thead>
          <tr className="group/header border-b text-left text-xs text-muted-foreground">
            <th
              scope="col"
              className={cn("px-3 py-2 font-medium", sortableHeaderClass)}
              onClick={() => onSort?.("name")}
            >
              <div className="flex items-center gap-2">
                {selectable && (
                  <div className="relative h-4 w-4 shrink-0">
                    <input
                      type="checkbox"
                      checked={!!allSelected}
                      onChange={() => onToggleAll?.()}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "h-4 w-4 rounded border-input accent-primary cursor-pointer transition-opacity",
                        anySelected ? "opacity-100" : "opacity-0 group-hover/header:opacity-100",
                      )}
                    />
                  </div>
                )}
                Name
                <SortIndicator column="name" sortBy={sortBy} sortOrder={sortOrder} />
              </div>
            </th>
            <th
              scope="col"
              className={cn("px-3 py-2 font-medium w-24", sortableHeaderClass)}
              onClick={() => onSort?.("size")}
            >
              <div className="flex items-center gap-1">
                Size
                <SortIndicator column="size" sortBy={sortBy} sortOrder={sortOrder} />
              </div>
            </th>
            <th
              scope="col"
              className={cn("px-3 py-2 font-medium w-32", sortableHeaderClass)}
              onClick={() => onSort?.("uploadedBy")}
            >
              <div className="flex items-center gap-1">
                Uploaded by
                <SortIndicator column="uploadedBy" sortBy={sortBy} sortOrder={sortOrder} />
              </div>
            </th>
            <th
              scope="col"
              className={cn("px-3 py-2 font-medium w-28", sortableHeaderClass)}
              onClick={() => onSort?.("updatedAt")}
            >
              <div className="flex items-center gap-1">
                Modified
                <SortIndicator column="updatedAt" sortBy={sortBy} sortOrder={sortOrder} />
              </div>
            </th>
            <th scope="col" className="px-3 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <FileRow
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
              isShared={sharedFileIds?.has(file.id)}
            />
          ))}
        </tbody>
      </table>

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
