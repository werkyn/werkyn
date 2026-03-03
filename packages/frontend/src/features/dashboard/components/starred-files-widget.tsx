import { useStarredFiles, type DriveFile } from "@/features/drive/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Star, File, Folder } from "lucide-react";

function formatSize(bytes: number | null) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface StarredFilesWidgetProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function StarredFilesWidget({ workspaceId, workspaceSlug }: StarredFilesWidgetProps) {
  const { data, isLoading } = useStarredFiles(workspaceId);
  const files = data?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="h-4 w-4" />
          Starred Files
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No starred files</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {files.map((file: DriveFile) => (
              <Link
                key={file.id}
                to="/$workspaceSlug/drive"
                params={{ workspaceSlug }}
                search={file.parentId ? { folderId: file.parentId } : {}}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors -mx-2"
              >
                {file.isFolder ? (
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 min-w-0 truncate">{file.name}</span>
                {file.size != null && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatSize(file.size)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
