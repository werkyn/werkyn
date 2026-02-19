import { useMemo } from "react";
import { useComments } from "../api";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceMembers } from "@/features/workspaces/api";
import { useParams } from "@tanstack/react-router";

interface CommentListProps {
  taskId: string;
  canComment: boolean;
}

export function CommentList({ taskId, canComment }: CommentListProps) {
  const user = useAuthStore((s) => s.user);
  const workspaces = useAuthStore((s) => s.workspaces);
  const isAdmin = workspaces.some((w) => w.role === "ADMIN");

  const { workspaceSlug } = useParams({ strict: false }) as {
    workspaceSlug?: string;
  };
  const membership = workspaceSlug
    ? workspaces.find((w) => w.workspace.slug === workspaceSlug)
    : undefined;
  const workspaceId = membership?.workspace.id || "";
  const { data: membersData } = useWorkspaceMembers(workspaceId);
  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of membersData?.data ?? []) {
      map.set(m.user.id, m.user.displayName);
    }
    return map;
  }, [membersData]);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useComments(taskId);

  const comments = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-muted-foreground">
        Comments
        {comments.length > 0 && (
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
            {comments.length}
          </span>
        )}
      </h3>

      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && comments.length === 0 && !canComment && (
        <p className="text-sm text-muted-foreground">No comments yet</p>
      )}

      {comments.length > 0 && (
        <div className="space-y-4 mb-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              taskId={taskId}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              memberMap={memberMap}
            />
          ))}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              {isFetchingNextPage ? "Loading..." : "Load more comments"}
            </button>
          )}
        </div>
      )}

      {canComment && <CommentForm taskId={taskId} />}
    </div>
  );
}
