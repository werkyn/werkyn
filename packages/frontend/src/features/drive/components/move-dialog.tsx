import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFiles, useMoveFile, type DriveFile } from "../api";
import { Folder, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MoveDialogProps {
  file: DriveFile | null;
  onClose: () => void;
  workspaceId: string;
}

export function MoveDialog({ file, onClose, workspaceId }: MoveDialogProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const moveFile = useMoveFile(workspaceId);

  // Reset state when a different file is opened (component is never unmounted)
  useEffect(() => {
    if (file) {
      setSelectedFolder(null);
      setExpandedFolders(new Set());
    }
  }, [file?.id]);

  // Scope to same context as the file being moved
  const fileTeamFolderId = file?.teamFolderId ?? undefined;

  // Load root-level folders (scoped to personal or team folder)
  const { data: rootData } = useFiles(workspaceId, null, fileTeamFolderId);
  const rootFolders = (rootData?.pages ?? [])
    .flatMap((p) => p.data)
    .filter((f) => f.isFolder && f.id !== file?.id);

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleMove = () => {
    if (!file) return;

    moveFile.mutate(
      { fileId: file.id, parentId: selectedFolder },
      {
        onSuccess: () => {
          toast.success("Moved successfully");
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to move");
        },
      },
    );
  };

  const rootLabel = fileTeamFolderId ? "Team Folder (root)" : "My Files (root)";

  return (
    <Dialog open={!!file} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move "{file?.name}"</DialogTitle>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto border rounded-md">
          <button
            onClick={() => setSelectedFolder(null)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
              selectedFolder === null && "bg-accent font-medium",
            )}
          >
            <Folder className="h-4 w-4 text-muted-foreground" />
            {rootLabel}
          </button>

          {rootFolders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              workspaceId={workspaceId}
              teamFolderId={fileTeamFolderId}
              excludeId={file?.id}
              selectedFolder={selectedFolder}
              expandedFolders={expandedFolders}
              onSelect={setSelectedFolder}
              onToggle={toggleExpand}
              depth={1}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={moveFile.isPending}>
            {moveFile.isPending ? "Moving..." : "Move here"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FolderItem({
  folder,
  workspaceId,
  teamFolderId,
  excludeId,
  selectedFolder,
  expandedFolders,
  onSelect,
  onToggle,
  depth,
}: {
  folder: DriveFile;
  workspaceId: string;
  teamFolderId?: string;
  excludeId?: string;
  selectedFolder: string | null;
  expandedFolders: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  depth: number;
}) {
  const isExpanded = expandedFolders.has(folder.id);
  const { data: childData, isLoading } = useFiles(
    workspaceId,
    folder.id,
    teamFolderId,
    { enabled: isExpanded },
  );
  const childFolders = isExpanded
    ? (childData?.pages ?? [])
        .flatMap((p) => p.data)
        .filter((f) => f.isFolder && f.id !== excludeId)
    : [];

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer",
          selectedFolder === folder.id && "bg-accent font-medium",
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => onSelect(folder.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(folder.id);
          }}
          className="shrink-0 p-0.5"
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              isExpanded && "rotate-90",
            )}
          />
        </button>
        <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">{folder.name}</span>
      </div>

      {isExpanded && isLoading && (
        <div
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
          style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
        >
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      )}
      {isExpanded &&
        !isLoading &&
        childFolders.map((child) => (
          <FolderItem
            key={child.id}
            folder={child}
            workspaceId={workspaceId}
            teamFolderId={teamFolderId}
            excludeId={excludeId}
            selectedFolder={selectedFolder}
            expandedFolders={expandedFolders}
            onSelect={onSelect}
            onToggle={onToggle}
            depth={depth + 1}
          />
        ))}
    </>
  );
}
