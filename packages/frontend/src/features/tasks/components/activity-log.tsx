import { useState, useEffect } from "react";
import { useTaskActivity, type ActivityEntry } from "../api";
import { UserAvatar } from "@/components/shared/user-avatar";
import { timeAgo } from "@/lib/time-ago";

interface ActivityLogProps {
  taskId: string;
}

function formatAction(entry: ActivityEntry): string {
  const details = entry.details;
  switch (entry.action) {
    case "created":
      return "created this task";
    case "status_changed":
      return "moved this task";
    case "priority_changed": {
      const to = details?.to as string | undefined;
      return to ? `changed priority to ${to}` : "changed priority";
    }
    case "field_edited": {
      const fields = details?.fields as string[] | undefined;
      return fields?.length ? `edited ${fields.join(", ")}` : "edited task";
    }
    case "assigned":
      return "assigned a member";
    case "unassigned":
      return "unassigned a member";
    case "subtask_added": {
      const title = details?.title as string | undefined;
      return title ? `added subtask "${title}"` : "added a subtask";
    }
    case "subtask_edited":
      return "edited a subtask";
    case "subtask_toggled": {
      const completed = details?.completed as boolean | undefined;
      const title = details?.title as string | undefined;
      if (completed !== undefined && title) {
        return completed ? `completed subtask "${title}"` : `reopened subtask "${title}"`;
      }
      return "toggled a subtask";
    }
    case "subtask_deleted": {
      const title = details?.title as string | undefined;
      return title ? `deleted subtask "${title}"` : "deleted a subtask";
    }
    case "comment_added":
      return "added a comment";
    case "comment_edited":
      return "edited a comment";
    case "comment_deleted":
      return "deleted a comment";
    case "bulk_updated":
      return "bulk updated this task";
    default:
      return entry.action.replace(/_/g, " ");
  }
}

export function ActivityLog({ taskId }: ActivityLogProps) {
  const [page, setPage] = useState(1);
  const [allEntries, setAllEntries] = useState<ActivityEntry[]>([]);
  const { data, isLoading } = useTaskActivity(taskId, page);
  const pagination = data?.pagination;

  // Accumulate entries across pages
  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllEntries(data.data);
      } else {
        setAllEntries((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEntries = data.data.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newEntries];
        });
      }
    }
  }, [data, page]);

  const entries = allEntries;

  if (isLoading && page === 1) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-muted" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity yet</p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-start gap-2">
          {entry.actor ? (
            <UserAvatar
              displayName={entry.actor.displayName}
              avatarUrl={entry.actor.avatarUrl}
              size="sm"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">
                {entry.actor?.displayName ?? "System"}
              </span>{" "}
              {formatAction(entry)}
            </p>
            <p className="text-xs text-muted-foreground">
              {timeAgo(entry.createdAt)}
            </p>
          </div>
        </div>
      ))}

      {pagination && pagination.page < pagination.totalPages && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
          className="text-xs text-primary hover:underline disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Load more activity"}
        </button>
      )}
    </div>
  );
}
