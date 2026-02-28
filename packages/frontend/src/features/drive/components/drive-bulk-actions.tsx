import { useState } from "react";
import type { DriveFile } from "../api";
import { useDownloadFile, useTrashFile } from "../api";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { X, FolderInput, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DriveBulkActionsProps {
  workspaceId: string;
  selectedFiles: DriveFile[];
  onClear: () => void;
  onMoveSelected: () => void;
  parentId?: string | null;
  teamFolderId?: string;
}

export function DriveBulkActions({
  workspaceId,
  selectedFiles,
  onClear,
  onMoveSelected,
  parentId,
  teamFolderId,
}: DriveBulkActionsProps) {
  const downloadFile = useDownloadFile(workspaceId);
  const trashFile = useTrashFile(workspaceId, parentId, teamFolderId);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [isTrashingBatch, setIsTrashingBatch] = useState(false);

  const count = selectedFiles.length;

  const handleDownloadAll = async () => {
    for (const file of selectedFiles) {
      if (!file.isFolder) {
        downloadFile.mutate({ fileId: file.id, fileName: file.name });
      }
    }
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

  const downloadableCount = selectedFiles.filter((f) => !f.isFolder).length;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
        <span className="text-sm font-medium">
          {count} selected
        </span>

        <Button variant="outline" size="sm" onClick={onMoveSelected}>
          <FolderInput className="h-4 w-4 mr-1" />
          Move
        </Button>

        {downloadableCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            disabled={downloadFile.isPending}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        )}

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
