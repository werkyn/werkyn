import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DriveFile } from "../api";
import { useFilePreviewUrl, useFileTextContent } from "../api";
import { getPreviewType, getFileIcon, formatFileSize } from "@/lib/file-icons";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/time-ago";

interface FilePreviewSlideoverProps {
  file: DriveFile;
  workspaceId: string;
  onClose: () => void;
  onDownload: (file: DriveFile) => void;
}

export function FilePreviewSlideover({
  file,
  workspaceId,
  onClose,
  onDownload,
}: FilePreviewSlideoverProps) {
  const previewType = getPreviewType(file.mimeType);
  const needsBlobUrl = previewType === "image" || previewType === "video" || previewType === "audio" || previewType === "pdf";
  const needsText = previewType === "text";

  const { data: blobUrl } = useFilePreviewUrl(
    workspaceId,
    needsBlobUrl ? file.id : null,
  );
  const { data: textContent } = useFileTextContent(
    workspaceId,
    needsText ? file.id : null,
  );

  // Revoke blob URL on cleanup
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Escape key handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const Icon = getFileIcon(file.mimeType, false);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l bg-background shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <span className="text-sm font-medium truncate mr-4" title={file.name}>
            {file.name}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(file)}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <PreviewContent
            previewType={previewType}
            blobUrl={blobUrl}
            textContent={textContent}
            file={file}
            Icon={Icon}
          />

          {/* Metadata section */}
          <div className="mt-6 space-y-2 border-t pt-4">
            <MetadataRow label="Name" value={file.name} />
            <MetadataRow label="Size" value={formatFileSize(file.size)} />
            <MetadataRow label="Type" value={file.mimeType ?? "Unknown"} />
            <MetadataRow
              label="Uploaded by"
              value={file.uploadedBy?.displayName ?? "Unknown"}
            />
            <MetadataRow label="Modified" value={timeAgo(file.updatedAt)} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function PreviewContent({
  previewType,
  blobUrl,
  textContent,
  file,
  Icon,
}: {
  previewType: string;
  blobUrl: string | undefined;
  textContent: string | undefined;
  file: DriveFile;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  if (previewType === "image") {
    if (!blobUrl) return <PreviewLoading />;
    return (
      <div className="flex items-center justify-center">
        <img
          src={blobUrl}
          alt={file.name}
          className="max-h-[60vh] max-w-full rounded-md object-contain"
        />
      </div>
    );
  }

  if (previewType === "video") {
    if (!blobUrl) return <PreviewLoading />;
    return (
      <div className="flex items-center justify-center">
        <video
          src={blobUrl}
          controls
          className="max-h-[60vh] max-w-full rounded-md"
        />
      </div>
    );
  }

  if (previewType === "audio") {
    if (!blobUrl) return <PreviewLoading />;
    return (
      <div className="flex items-center justify-center py-8">
        <audio src={blobUrl} controls className="w-full max-w-md" />
      </div>
    );
  }

  if (previewType === "pdf") {
    if (!blobUrl) return <PreviewLoading />;
    return (
      <iframe
        src={blobUrl}
        title={file.name}
        className="h-[60vh] w-full rounded-md border"
      />
    );
  }

  if (previewType === "text") {
    if (textContent === undefined) return <PreviewLoading />;
    return (
      <pre className="max-h-[60vh] overflow-auto rounded-md border bg-muted/50 p-4 text-sm font-mono whitespace-pre-wrap break-words">
        {textContent}
      </pre>
    );
  }

  // Unsupported
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="h-16 w-16 mb-4" />
      <p className="text-sm font-medium">{file.name}</p>
      <p className="text-xs mt-1">Preview not available for this file type</p>
    </div>
  );
}

function PreviewLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
