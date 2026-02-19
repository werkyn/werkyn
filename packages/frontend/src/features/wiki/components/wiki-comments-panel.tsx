import { useState } from "react";
import { X, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useWikiComments,
  useResolveWikiComment,
  type WikiComment,
} from "../api";
import { cn } from "@/lib/utils";

interface WikiCommentsPanelProps {
  pageId: string;
  onClose: () => void;
}

export function WikiCommentsPanel({ pageId, onClose }: WikiCommentsPanelProps) {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const resolvedParam =
    filter === "all" ? undefined : filter === "resolved" ? true : false;

  const { data: commentsData, isLoading } = useWikiComments(pageId, resolvedParam);
  const resolveComment = useResolveWikiComment(pageId);

  const comments = commentsData?.data ?? [];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 border-l bg-background shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-sm">Comments</h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b px-4">
        {(["open", "all", "resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "px-3 py-2 text-sm capitalize transition-colors border-b-2",
              filter === tab
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No {filter !== "all" ? filter : ""} comments</p>
          </div>
        ) : (
          <div className="divide-y">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onResolve={() => resolveComment.mutate(comment.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onResolve,
}: {
  comment: WikiComment;
  onResolve: () => void;
}) {
  return (
    <div className="px-4 py-3 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.author.displayName}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.body}</p>
          {comment.resolved && comment.resolvedBy && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              Resolved by {comment.resolvedBy.displayName}
            </p>
          )}
        </div>
        {!comment.resolved && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onResolve}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            title="Resolve comment"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
