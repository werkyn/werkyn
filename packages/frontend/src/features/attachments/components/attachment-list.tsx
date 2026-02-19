import { useRef, useState } from "react";
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  useDownloadAttachment,
  useLinkAttachment,
} from "../api";
import { getFileIcon, formatFileSize } from "@/lib/file-icons";
import { Paperclip, Download, X, Plus, HardDrive, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { DriveFilePicker } from "@/features/drive/components/drive-file-picker";
import { useWorkspaceSettings } from "@/features/admin/api";

interface AttachmentListProps {
  workspaceId: string;
  taskId: string;
  canEdit: boolean;
}

export function AttachmentList({
  workspaceId,
  taskId,
  canEdit,
}: AttachmentListProps) {
  const { data, isLoading } = useAttachments(workspaceId, "task", taskId);
  const uploadAttachment = useUploadAttachment(workspaceId, "task", taskId);
  const deleteAttachment = useDeleteAttachment(workspaceId, "task", taskId);
  const linkAttachment = useLinkAttachment(workspaceId, "task", taskId);
  const downloadAttachment = useDownloadAttachment(workspaceId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const { data: settingsData } = useWorkspaceSettings(workspaceId);
  const driveEnabled = settingsData?.data?.enabledModules?.includes("drive") ?? true;

  const attachments = data?.data ?? [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      uploadAttachment.mutate(file, {
        onError: (err) => toast.error(err.message || "Upload failed"),
      });
    }
    e.target.value = "";
  };

  const handleDownload = (attachmentId: string, name: string) => {
    downloadAttachment(attachmentId, name).catch(() =>
      toast.error("Download failed"),
    );
  };

  const handleDelete = (attachmentId: string) => {
    deleteAttachment.mutate(attachmentId, {
      onError: (err) => toast.error(err.message || "Failed to delete"),
    });
  };

  // Hide section entirely if no attachments and user can't edit
  if (!canEdit && attachments.length === 0 && !isLoading) return null;

  return (
    <div>
      <h3 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1.5">
        <Paperclip className="h-3.5 w-3.5" />
        Attachments
        {attachments.length > 0 && (
          <span className="text-xs">({attachments.length})</span>
        )}
      </h3>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {attachments.length > 0 && (
        <div className="space-y-1 mb-2">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.mimeType, false);
            return (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors group"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{att.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatFileSize(att.size)}
                </span>
                {att.fileId && att.file?.trashedAt && (
                  <span title="Source file is in trash">
                    <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                  </span>
                )}
                {att.fileId && !att.file && (
                  <span title="Source file has been deleted">
                    <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />
                  </span>
                )}
                {att.fileId && att.file && !att.file.trashedAt && (
                  <span title="Linked from Drive">
                    <HardDrive className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </span>
                )}
                <button
                  onClick={() => handleDownload(att.id, att.name)}
                  className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(att.id)}
                    className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent transition-all text-muted-foreground hover:text-destructive"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAttachment.isPending}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {uploadAttachment.isPending ? "Uploading..." : "Attach file"}
          </button>
          {driveEnabled && (
            <button
              onClick={() => setShowDrivePicker(true)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <HardDrive className="h-3.5 w-3.5" />
              From Drive
            </button>
          )}
        </div>
      )}

      {driveEnabled && (
        <DriveFilePicker
          open={showDrivePicker}
          onClose={() => setShowDrivePicker(false)}
          workspaceId={workspaceId}
          isPending={linkAttachment.isPending}
          onSelect={(file) => {
            linkAttachment.mutate(file.id, {
              onSuccess: () => {
                setShowDrivePicker(false);
              },
              onError: (err) =>
                toast.error(err.message || "Failed to link file"),
            });
          }}
        />
      )}
    </div>
  );
}
