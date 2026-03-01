import { useState } from "react";
import type { DriveFile } from "../api";
import { useArchiveFiles, useTrashFile } from "../api";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { X, FolderInput, Archive, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DriveBulkActionsProps {
  workspaceId: string;
  selectedFiles: DriveFile[];
  onClear: () => void;
  onMoveSelected: () => void;
  onShareSelected?: () => void;
  parentId?: string | null;
  teamFolderId?: string;
}

export function DriveBulkActions({
  workspaceId,
  selectedFiles,
  onClear,
  onMoveSelected,
  onShareSelected,
  parentId,
  teamFolderId,
}: DriveBulkActionsProps) {
  const archiveFiles = useArchiveFiles(workspaceId);
  const trashFile = useTrashFile(workspaceId);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [isTrashingBatch, setIsTrashingBatch] = useState(false);

  const count = selectedFiles.length;

  const handleDownloadAsZip = () => {
    const fileIds = selectedFiles.map((f) => f.id);
    archiveFiles.mutate(
      { fileIds, archiveName: "files.zip" },
      { onError: () => toast.error("Archive download failed") },
    );
  };

  const handleTrashAll = async () => {
    setIsTrashingBatch(true);
    const results = await Promise.allSettled(
      selectedFiles.map(
        (file) =>
          new Promise<void>((resolve, reject) => {
            trashFile.mutate(file.id, {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            });
          }),
      ),
    );
    setIsTrashingBatch(false);
    setShowTrashConfirm(false);

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (failed === 0) {
      toast.success(`Moved ${succeeded} file${succeeded !== 1 ? "s" : ""} to trash`);
    } else {
      toast.error(`${failed} file${failed !== 1 ? "s" : ""} failed to trash`);
    }
    onClear();
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
        <span className="text-sm font-medium">
          {count} selected
        </span>

        {onShareSelected && (
          <Button variant="outline" size="sm" onClick={onShareSelected}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={onMoveSelected}>
          <FolderInput className="h-4 w-4 mr-1" />
          Move
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadAsZip}
          disabled={archiveFiles.isPending}
        >
          <Archive className="h-4 w-4 mr-1" />
          Download as ZIP
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowTrashConfirm(true)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Trash
        </Button>

        <button
          onClick={onClear}
          className="rounded-md p-1 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        open={showTrashConfirm}
        onClose={() => setShowTrashConfirm(false)}
        onConfirm={handleTrashAll}
        title={`Move ${count} item${count !== 1 ? "s" : ""} to trash?`}
        description="Items in trash can be restored later."
        confirmLabel="Trash"
        variant="destructive"
        loading={isTrashingBatch}
      />
    </>
  );
}
