import {
  Folder,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileCode,
  FileArchive,
  File,
  type LucideIcon,
} from "lucide-react";

export function getFileIcon(mimeType: string | null, isFolder: boolean): LucideIcon {
  if (isFolder) return Folder;
  if (!mimeType) return File;

  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.startsWith("text/")) return FileText;

  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("html") ||
    mimeType.includes("css")
  ) {
    return FileCode;
  }

  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gzip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    mimeType.includes("compressed")
  ) {
    return FileArchive;
  }

  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation") ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint")
  ) {
    return FileText;
  }

  return File;
}

export type PreviewType = "image" | "video" | "audio" | "pdf" | "text" | "unsupported";

const TEXT_MIME_TYPES = [
  "application/json",
  "application/xml",
  "text/xml",
  "application/javascript",
  "text/javascript",
  "application/typescript",
  "text/css",
  "text/html",
  "application/x-yaml",
  "application/x-sh",
];

export function getPreviewType(mimeType: string | null): PreviewType {
  if (!mimeType) return "unsupported";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/") || TEXT_MIME_TYPES.includes(mimeType))
    return "text";
  return "unsupported";
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
