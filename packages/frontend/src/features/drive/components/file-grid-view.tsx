import type { DriveFile } from "../api";
import { FileCard } from "./file-card";
import { Button } from "@/components/ui/button";

interface FileGridViewProps {
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

export function FileGridView({
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
}: FileGridViewProps) {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {files.map((file) => (
          <FileCard
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
      </div>

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
