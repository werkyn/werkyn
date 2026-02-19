import type { DriveFile } from "../api";
import { FileRow } from "./file-row";
import { Button } from "@/components/ui/button";

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
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium w-24">Size</th>
            <th className="px-3 py-2 font-medium w-32">Uploaded by</th>
            <th className="px-3 py-2 font-medium w-28">Modified</th>
            <th className="px-3 py-2 w-10" />
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
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
