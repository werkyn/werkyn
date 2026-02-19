import { useState } from "react";
import { useFiles, useTeamFolders, type DriveFile } from "../api";
import { getFileIcon, formatFileSize } from "@/lib/file-icons";
import {
  Folder,
  ArrowLeft,
  HardDrive,
  Users,
  X,
  Check,
  Loader2,
} from "lucide-react";

interface DriveFilePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (file: DriveFile) => void;
  workspaceId: string;
  isPending?: boolean;
}

interface FolderStackEntry {
  id: string | null;
  name: string;
  teamFolderId?: string;
}

export function DriveFilePicker({
  open,
  onClose,
  onSelect,
  workspaceId,
  isPending,
}: DriveFilePickerProps) {
  const [folderStack, setFolderStack] = useState<FolderStackEntry[]>([
    { id: null, name: "Drive" },
  ]);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  const currentFolder = folderStack[folderStack.length - 1];
  const isRoot = folderStack.length === 1;
  const currentTeamFolderId = currentFolder.teamFolderId;

  const { data, isLoading } = useFiles(
    workspaceId,
    currentFolder.id,
    currentTeamFolderId,
  );
  const { data: teamFoldersData } = useTeamFolders(workspaceId);
  const teamFolders = teamFoldersData?.data ?? [];

  const allFiles = data?.pages?.flatMap((p) => p.data) ?? [];

  const folders = allFiles.filter((f) => f.isFolder && !f.trashedAt);
  const files = allFiles.filter((f) => !f.isFolder && !f.trashedAt);

  const enterFolder = (folder: DriveFile, teamFolderId?: string) => {
    setSelectedFile(null);
    setFolderStack((s) => [
      ...s,
      { id: folder.id, name: folder.name, teamFolderId },
    ]);
  };

  const enterTeamFolder = (tf: { id: string; folderId: string; name: string }) => {
    setSelectedFile(null);
    setFolderStack((s) => [
      ...s,
      { id: tf.folderId, name: tf.name, teamFolderId: tf.id },
    ]);
  };

  const goBack = () => {
    if (folderStack.length <= 1) return;
    setSelectedFile(null);
    setFolderStack((s) => s.slice(0, -1));
  };

  const handleClose = () => {
    setFolderStack([{ id: null, name: "Drive" }]);
    setSelectedFile(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border bg-popover shadow-lg flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Select from Drive</span>
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Breadcrumb / Back */}
        <div className="flex items-center gap-1 border-b px-4 py-2">
          {folderStack.length > 1 && (
            <button
              onClick={goBack}
              className="rounded p-1 hover:bg-accent transition-colors mr-1"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <span className="text-xs text-muted-foreground truncate">
            {folderStack.map((f) => f.name).join(" / ")}
          </span>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Team folders at root */}
              {isRoot && teamFolders.length > 0 && (
                <>
                  {teamFolders.map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() =>
                        enterTeamFolder({
                          id: tf.id,
                          folderId: tf.folder.id,
                          name: tf.name,
                        })
                      }
                      className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate flex-1">{tf.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tf._count.members} members
                      </span>
                    </button>
                  ))}
                  <div className="mx-1 my-1 border-b" />
                </>
              )}

              {folders.length === 0 && files.length === 0 && !(isRoot && teamFolders.length > 0) ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  This folder is empty
                </p>
              ) : (
                <>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => enterFolder(folder, currentTeamFolderId)}
                      className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate flex-1">{folder.name}</span>
                    </button>
                  ))}
                  {files.map((file) => {
                    const Icon = getFileIcon(file.mimeType, false);
                    const isSelected = selectedFile?.id === file.id;
                    return (
                      <button
                        key={file.id}
                        onClick={() =>
                          setSelectedFile(isSelected ? null : file)
                        }
                        className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors text-left ${
                          isSelected
                            ? "bg-primary/10 ring-1 ring-primary/30"
                            : "hover:bg-accent"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatFileSize(file.size)}
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button
            onClick={handleClose}
            className="rounded-md px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!selectedFile || isPending}
            onClick={() => selectedFile && onSelect(selectedFile)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Attach
          </button>
        </div>
      </div>
    </div>
  );
}
