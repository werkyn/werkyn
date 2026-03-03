import { useWikiSpaces, useWikiPageTree, type WikiPageTreeItem } from "@/features/wiki/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";

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

interface MyWikiEditsWidgetProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function MyWikiEditsWidget({ workspaceId, workspaceSlug }: MyWikiEditsWidgetProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: spacesData, isLoading: spacesLoading } = useWikiSpaces(workspaceId);
  const spaces = spacesData?.data ?? [];

  const spaceQueries = spaces.map((s) => useWikiPageTree(s.id));

  const isLoading = spacesLoading || spaceQueries.some((q) => q.isLoading);

  const myPages = useMemo(() => {
    if (!userId) return [];
    const allPages: (WikiPageTreeItem & { _spaceId: string; _spaceName: string })[] = [];
    spaces.forEach((space, i) => {
      const pages = spaceQueries[i]?.data?.data ?? [];
      pages.forEach((p) => {
        if (
          p.lastEditedById === userId ||
          (p.createdById === userId && p.lastEditedById === null)
        ) {
          allPages.push({ ...p, _spaceId: space.id, _spaceName: space.name });
        }
      });
    });
    return allPages
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [spaces, spaceQueries, userId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <PenLine className="h-4 w-4" />
          My Wiki Edits
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : myPages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No wiki edits yet</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {myPages.map((page) => (
              <Link
                key={page.id}
                to="/$workspaceSlug/knowledge"
                params={{ workspaceSlug }}
                search={{ spaceId: page._spaceId, pageId: page.id }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <span className="shrink-0">{page.icon ?? "📄"}</span>
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{page.title}</span>
                  <span className="text-xs text-muted-foreground truncate block">
                    {page._spaceName}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {timeAgo(page.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
