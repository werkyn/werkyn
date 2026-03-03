import { useFiles, type DriveFile } from "@/features/drive/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Clock, File, Folder } from "lucide-react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface RecentFilesWidgetProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function RecentFilesWidget({ workspaceId, workspaceSlug }: RecentFilesWidgetProps) {
  const { data, isLoading } = useFiles(workspaceId, undefined, undefined, undefined, {
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const files = (data?.pages[0]?.data ?? []).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Files
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No recent files</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {files.map((file: DriveFile) => (
              <Link
                key={file.id}
                to="/$workspaceSlug/drive"
                params={{ workspaceSlug }}
                search={file.parentId ? { folderId: file.parentId } : {}}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                {file.isFolder ? (
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{file.name}</span>
                  <span className="text-xs text-muted-foreground truncate block">
                    {file.uploadedBy.displayName}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {timeAgo(file.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
