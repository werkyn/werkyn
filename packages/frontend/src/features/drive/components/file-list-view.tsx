import type { DriveFile } from "../api";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { FileRow } from "./file-row";
import { Loader2 } from "lucide-react";

interface FileListViewProps {
  files: DriveFile[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  canEdit: boolean;
  onLoadMore: () => void;
  onNavigate: (folderId: string) => void;
  onDownload: (file: DriveFile) => void;
  onRename: (file: DriveFile) => void;
  onMove: (file: DriveFile) => void;
  onTrash: (file: DriveFile) => void;
}

export function FileListView({
  files,
  hasNextPage,
  isFetchingNextPage,
  canEdit,
  onLoadMore,
  onNavigate,
  onDownload,
  onRename,
  onMove,
  onTrash,
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

  return (
    <div>
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium">Name</th>
            <th scope="col" className="px-3 py-2 font-medium w-24">Size</th>
            <th scope="col" className="px-3 py-2 font-medium w-32">Uploaded by</th>
            <th scope="col" className="px-3 py-2 font-medium w-28">Modified</th>
            <th scope="col" className="px-3 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              canEdit={canEdit}
              onNavigate={onNavigate}
              onDownload={onDownload}
              onRename={onRename}
              onMove={onMove}
              onTrash={onTrash}
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
