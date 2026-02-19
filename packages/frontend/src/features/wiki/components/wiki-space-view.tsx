import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWikiSpace, useWikiPageTree, useCreateWikiPage } from "../api";
import { Skeleton } from "@/components/ui/skeleton";

interface WikiSpaceViewProps {
  spaceId: string;
  onPageClick: (pageId: string) => void;
}

export function WikiSpaceView({ spaceId, onPageClick }: WikiSpaceViewProps) {
  const { data: spaceData, isLoading: spaceLoading } = useWikiSpace(spaceId);
  const { data: pagesData, isLoading: pagesLoading } = useWikiPageTree(spaceId);
  const createPage = useCreateWikiPage(spaceId);

  const space = spaceData?.data;
  const pages = pagesData?.data ?? [];

  const handleNewPage = () => {
    createPage.mutate(
      { title: "Untitled" },
      {
        onSuccess: (res) => onPageClick(res.data.id),
      },
    );
  };

  if (spaceLoading) {
    return (
      <div className="mx-auto max-w-4xl p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Space not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {space.icon && <span>{space.icon}</span>}
            {space.name}
          </h1>
          {space.description && (
            <p className="text-muted-foreground mt-1">{space.description}</p>
          )}
        </div>
        <Button onClick={handleNewPage} size="sm" disabled={createPage.isPending}>
          <Plus className="h-4 w-4 mr-1" />
          New Page
        </Button>
      </div>

      {pagesLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No pages yet</p>
          <p className="text-sm">Create your first page to get started.</p>
          <Button onClick={handleNewPage} className="mt-4" disabled={createPage.isPending}>
            <Plus className="h-4 w-4 mr-1" />
            Create Page
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPageClick(page.id)}
              className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left hover:bg-accent transition-colors"
            >
              {page.icon ? (
                <span className="text-lg">{page.icon}</span>
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{page.title}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(page.updatedAt).toLocaleDateString()}
                  {page._count.children > 0 && (
                    <span className="ml-2">
                      {page._count.children} subpage{page._count.children !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
