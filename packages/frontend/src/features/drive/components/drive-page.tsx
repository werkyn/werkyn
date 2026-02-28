import { useState, useRef, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useFiles, useDownloadFile, useTrashFile, uploadSingleFile, useInvalidateFiles, useMoveFile, useTeamFolders, type DriveFile } from "../api";
import { useAuthStore } from "@/stores/auth-store";
import { usePermissions } from "@/hooks/use-permissions";
import { getFileIcon } from "@/lib/file-icons";
import { FileBreadcrumbs } from "./file-breadcrumbs";
import { FileListView } from "./file-list-view";
import { FileGridView } from "./file-grid-view";
import { TrashView } from "./trash-view";
import { CreateFolderDialog } from "./create-folder-dialog";
import { RenameDialog } from "./rename-dialog";
import { MoveDialog } from "./move-dialog";
import { UploadDropzone } from "./upload-dropzone";
import { UploadProgress, type UploadItem } from "./upload-progress";
import { TeamFoldersSection } from "./team-folders-section";
import { Button } from "@/components/ui/button";
import {
  FolderPlus,
  Upload,
  List,
  LayoutGrid,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DrivePageProps {
  workspaceId: string;
  workspaceSlug: string;
  folderId?: string;
  teamFolderId?: string;
  view: "list" | "grid";
  trash: boolean;
  onNavigate: (folderId?: string, teamFolderId?: string) => void;
  onViewChange: (view: "list" | "grid") => void;
  onTrashToggle: (trash: boolean) => void;
}

export function DrivePage({
  workspaceId,
  workspaceSlug,
  folderId,
  teamFolderId,
  view,
  trash,
  onNavigate,
  onViewChange,
  onTrashToggle,
}: DrivePageProps) {
  const workspaces = useAuthStore((s) => s.workspaces);
  const user = useAuthStore((s) => s.user);
  const membership = workspaces.find(
    (w) => w.workspace.slug === workspaceSlug,
  );
  const permissions = usePermissions(membership, user?.id);
  const canEdit = permissions.canEdit;
  const isAdmin = membership?.role === "ADMIN";

  // Determine if we're at root level (no folderId AND no teamFolderId)
  const isRoot = !folderId && !teamFolderId;

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isLoading } =
    useFiles(workspaceId, folderId ?? null, teamFolderId);
  const files = (data?.pages ?? []).flatMap((p) => p.data);

  // Fetch team folder info for breadcrumbs
  const { data: teamFoldersData } = useTeamFolders(workspaceId);
  const currentTeamFolder = teamFolderId
    ? teamFoldersData?.data?.find((tf) => tf.id === teamFolderId)
    : undefined;

  const downloadFile = useDownloadFile(workspaceId);
  const trashFile = useTrashFile(workspaceId, folderId ?? null, teamFolderId);
  const invalidateFiles = useInvalidateFiles(workspaceId, folderId ?? null, teamFolderId);
  const moveFile = useMoveFile(workspaceId);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFile, setRenameFile] = useState<DriveFile | null>(null);
  const [moveFileDialog, setMoveFileDialog] = useState<DriveFile | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [activeDrag, setActiveDrag] = useState<DriveFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const file = event.active.data.current?.file as DriveFile | undefined;
    setActiveDrag(file ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);

      const { active, over } = event;
      if (!over) return;

      const activeFileId = active.data.current?.id as string;
      const overData = over.data.current;
      if (!overData || overData.type !== "folder") return;

      const targetFolderId = overData.id as string;

      if (activeFileId === targetFolderId) return;

      moveFile.mutate(
        { fileId: activeFileId, parentId: targetFolderId },
        {
          onSuccess: () => toast.success("File moved"),
          onError: (err) => toast.error(err.message || "Failed to move file"),
        },
      );
    },
    [moveFile],
  );

  const handleDownload = useCallback(
    (file: DriveFile) => {
      downloadFile(file.id, file.name).catch(() =>
        toast.error("Download failed"),
      );
    },
    [downloadFile],
  );

  const handleTrash = useCallback(
    (file: DriveFile) => {
      trashFile.mutate(file.id, {
        onSuccess: () => toast.success("Moved to trash"),
        onError: (err) => toast.error(err.message || "Failed to trash"),
      });
    },
    [trashFile],
  );

  const handleUpload = useCallback(
    (fileList: File[]) => {
      const parentId = folderId ?? null;
      const items: UploadItem[] = fileList.map((f) => ({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        name: f.name,
        size: f.size,
        status: "uploading" as const,
        progress: 0,
        loaded: 0,
        speed: 0,
      }));
      setUploads((prev) => [...prev, ...items]);

      const uploadAll = async () => {
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          const item = items[i];
          let startTime = Date.now();
          let lastLoaded = 0;

          try {
            await uploadSingleFile(
              workspaceId,
              file,
              parentId,
              (loaded, total) => {
                const now = Date.now();
                const elapsed = (now - startTime) / 1000;
                const speed = elapsed > 0 ? (loaded - lastLoaded) / Math.max(elapsed, 0.1) : 0;
                lastLoaded = loaded;
                startTime = now;

                setUploads((prev) =>
                  prev.map((u) =>
                    u.id === item.id
                      ? { ...u, progress: (loaded / total) * 100, loaded, speed }
                      : u,
                  ),
                );
              },
            );
            setUploads((prev) =>
              prev.map((u) =>
                u.id === item.id
                  ? { ...u, status: "done" as const, progress: 100, loaded: file.size, speed: 0 }
                  : u,
              ),
            );
          } catch (err) {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === item.id ? { ...u, status: "error" as const, speed: 0 } : u,
              ),
            );
            toast.error(err instanceof Error ? err.message : `Upload failed: ${file.name}`);
          }
        }
        invalidateFiles();
      };

      uploadAll();
    },
    [workspaceId, folderId, invalidateFiles],
  );

  const handleNavigate = useCallback(
    (id: string) => onNavigate(id, teamFolderId),
    [onNavigate, teamFolderId],
  );

  const DragOverlayContent = activeDrag ? () => {
    const Icon = getFileIcon(activeDrag.mimeType, activeDrag.isFolder);
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 shadow-lg">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm truncate max-w-48">{activeDrag.name}</span>
      </div>
    );
  } : null;

  const contentArea = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : view === "list" ? (
        <FileListView
          files={files}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          canEdit={canEdit}
          onLoadMore={() => fetchNextPage()}
          onNavigate={handleNavigate}
          onDownload={handleDownload}
          onRename={setRenameFile}
          onMove={setMoveFileDialog}
          onTrash={handleTrash}
        />
      ) : (
        <FileGridView
          files={files}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          canEdit={canEdit}
          onLoadMore={() => fetchNextPage()}
          onNavigate={handleNavigate}
          onDownload={handleDownload}
          onRename={setRenameFile}
          onMove={setMoveFileDialog}
          onTrash={handleTrash}
        />
      )}
    </>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-3 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {trash ? (
              <>
                <button
                  onClick={() => onTrashToggle(false)}
                  className="rounded-md p-1 hover:bg-accent transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-2xl font-bold">Trash</h1>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold">Drive</h1>
              </>
            )}
          </div>

        <div className="flex items-center gap-2">
          {!trash && (
            <>
              <div className="flex items-center rounded-md border">
                <button
                  onClick={() => onViewChange("list")}
                  className={cn(
                    "rounded-l-md p-1.5 transition-colors",
                    view === "list"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onViewChange("grid")}
                  className={cn(
                    "rounded-r-md p-1.5 transition-colors",
                    view === "grid"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>

              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateFolderOpen(true)}
                  >
                    <FolderPlus className="mr-1.5 h-4 w-4" />
                    New Folder
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    Upload
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTrashToggle(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        </div>
        {!trash && (folderId || teamFolderId) && (
          <FileBreadcrumbs
            workspaceId={workspaceId}
            folderId={folderId}
            teamFolderId={teamFolderId}
            teamFolderName={currentTeamFolder?.name}
            onNavigate={(id, tfid) => onNavigate(id, tfid)}
          />
        )}
      </div>

      {/* Content */}
      {trash ? (
        <div className="flex-1 overflow-y-auto">
          <TrashView workspaceId={workspaceId} />
        </div>
      ) : (
        <UploadDropzone
          onDrop={handleUpload}
          fileInputRef={fileInputRef}
          disabled={!canEdit}
        >
          <div className="flex-1 overflow-y-auto">
            {/* Team folders section — only at root */}
            {isRoot && (
              <TeamFoldersSection
                workspaceId={workspaceId}
                isAdmin={isAdmin}
                onNavigate={(fid, tfid) => onNavigate(fid, tfid)}
              />
            )}

            {/* Personal files header at root */}
            {isRoot && (
              <div className="px-4 pt-3 pb-1">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                  My Files
                </h3>
              </div>
            )}

            {canEdit && !trash ? (
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {contentArea}
                <DragOverlay dropAnimation={null}>
                  {DragOverlayContent && <DragOverlayContent />}
                </DragOverlay>
              </DndContext>
            ) : (
              contentArea
            )}
          </div>
        </UploadDropzone>
      )}

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        workspaceId={workspaceId}
        parentId={folderId}
        teamFolderId={teamFolderId}
      />

      <RenameDialog
        file={renameFile}
        onClose={() => setRenameFile(null)}
        workspaceId={workspaceId}
        parentId={folderId}
        teamFolderId={teamFolderId}
      />

      <MoveDialog
        file={moveFileDialog}
        onClose={() => setMoveFileDialog(null)}
        workspaceId={workspaceId}
      />

      <UploadProgress
        uploads={uploads}
        onDismiss={() => setUploads([])}
      />
    </div>
  );
}
