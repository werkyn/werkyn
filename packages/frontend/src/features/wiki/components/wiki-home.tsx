import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWikiSpaces } from "../api";
import { CreateSpaceDialog } from "./create-space-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuthStore } from "@/stores/auth-store";

interface WikiHomeProps {
  workspaceId: string;
  workspaceSlug: string;
  onSpaceClick: (spaceId: string) => void;
}

export function WikiHome({ workspaceId, workspaceSlug, onSpaceClick }: WikiHomeProps) {
  const { data: spacesData, isLoading } = useWikiSpaces(workspaceId);
  const [createOpen, setCreateOpen] = useState(false);

  const workspaces = useAuthStore((s) => s.workspaces);
  const user = useAuthStore((s) => s.user);
  const membership = workspaces.find((w) => w.workspace.slug === workspaceSlug);
  const permissions = usePermissions(membership, user?.id);

  const spaces = spacesData?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Documentation and team knowledge
          </p>
        </div>
        {permissions.canCreate && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Space
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No spaces yet</p>
          <p className="text-sm">Create a space to start organizing your documentation.</p>
          {permissions.canCreate && (
            <Button onClick={() => setCreateOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Create Space
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {spaces.map((space) => (
            <button
              key={space.id}
              onClick={() => onSpaceClick(space.id)}
              className="flex flex-col rounded-lg border p-5 text-left hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                {space.icon ? (
                  <span className="text-2xl">{space.icon}</span>
                ) : (
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                )}
                <h3 className="font-semibold text-lg">{space.name}</h3>
              </div>
              {space.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {space.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-auto pt-3">
                {space._count.pages} page{space._count.pages !== 1 ? "s" : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      <CreateSpaceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}
