import { useState } from "react";
import { useTrashedFiles, useRestoreFile, useDeleteFilePermanently, useFileAttachmentCount, type DriveFile } from "../api";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { getFileIcon } from "@/lib/file-icons";
import { timeAgo } from "@/lib/time-ago";
import { FileActionMenu } from "./file-action-menu";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface TrashViewProps {
  workspaceId: string;
}

export function TrashView({ workspaceId }: TrashViewProps) {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useTrashedFiles(workspaceId);
  const restoreFile = useRestoreFile(workspaceId);
  const deletePermanently = useDeleteFilePermanently(workspaceId);
  const sentinelRef = useInfiniteScroll(!!hasNextPage, isFetchingNextPage, fetchNextPage);

  const [confirmDelete, setConfirmDelete] = useState<DriveFile | null>(null);
  const { data: attachmentCountData } = useFileAttachmentCount(
    workspaceId,
    confirmDelete?.isFolder ? null : confirmDelete?.id ?? null,
  );
  const attachmentCount = attachmentCountData?.data?.count ?? 0;

  const files = (data?.pages ?? []).flatMap((p) => p.data);

  const handleRestore = (fileId: string) => {
    restoreFile.mutate(fileId, {
      onSuccess: () => toast.success("File restored"),
      onError: (err) => toast.error(err.message || "Failed to restore"),
    });
  };

  const handleDeletePermanently = () => {
    if (!confirmDelete) return;
    deletePermanently.mutate(confirmDelete.id, {
      onSuccess: () => {
        toast.success("Permanently deleted");
        setConfirmDelete(null);
      },
      onError: (err) => toast.error(err.message || "Failed to delete"),
    });
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Trash is empty</p>
      </div>
    );
  }

  return (
    <>
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium">Name</th>
            <th scope="col" className="px-3 py-2 font-medium w-28">Trashed</th>
            <th scope="col" className="px-3 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const Icon = getFileIcon(file.mimeType, file.isFolder);
            return (
              <tr
                key={file.id}
                className="border-b hover:bg-accent/50 transition-colors"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-sm text-muted-foreground whitespace-nowrap">
                  {file.trashedAt ? timeAgo(file.trashedAt) : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <FileActionMenu
                    file={file}
                    isTrash
                    onRestore={() => handleRestore(file.id)}
                    onDeletePermanently={() => setConfirmDelete(file)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete permanently?</DialogTitle>
            <DialogDescription>
              "{confirmDelete?.name}" will be permanently deleted. This cannot be
              undone.
            </DialogDescription>
            {attachmentCount > 0 && (
              <p className="mt-2 text-sm text-destructive">
                This file is linked to {attachmentCount} task{" "}
                {attachmentCount === 1 ? "attachment" : "attachments"}. Deleting
                it will break {attachmentCount === 1 ? "that link" : "those links"}.
              </p>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePermanently}
              disabled={deletePermanently.isPending}
            >
              {deletePermanently.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
