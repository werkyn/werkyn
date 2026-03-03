import { useWorkspaceActivity, type WorkspaceActivityEntry } from "@/features/dashboard/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { timeAgo } from "@/lib/time-ago";
import { Activity } from "lucide-react";

interface ActivityFeedWidgetProps {
  workspaceId: string;
  onTaskClick: (taskId: string, projectId: string) => void;
}

const actionLabels: Record<string, string> = {
  created: "created",
  status_changed: "moved",
  priority_changed: "changed priority of",
  field_edited: "edited",
  assigned: "assigned someone to",
  unassigned: "unassigned someone from",
  subtask_added: "added a subtask to",
  subtask_toggled: "toggled a subtask on",
  subtask_deleted: "deleted a subtask from",
  comment_added: "commented on",
  comment_edited: "edited a comment on",
  comment_deleted: "deleted a comment on",
  bulk_updated: "updated",
};

function getActionLabel(action: string): string {
  return actionLabels[action] ?? action.replace(/_/g, " ");
}

export function ActivityFeedWidget({ workspaceId, onTaskClick }: ActivityFeedWidgetProps) {
  const { data, isLoading } = useWorkspaceActivity(workspaceId);
  const entries = data?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No recent activity</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {entries.map((entry: WorkspaceActivityEntry) => (
              <div key={entry.id} className="flex items-start gap-2">
                {entry.actor ? (
                  <UserAvatar
                    displayName={entry.actor.displayName}
                    avatarUrl={entry.actor.avatarUrl}
                    size="sm"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">
                      {entry.actor?.displayName ?? "System"}
                    </span>{" "}
                    {getActionLabel(entry.action)}{" "}
                    <button
                      onClick={() => onTaskClick(entry.task.id, entry.task.project.id)}
                      className="font-medium hover:underline text-left"
                    >
                      {entry.task.title}
                    </button>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: entry.task.project.color ?? "#6366f1" }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {entry.task.project.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(entry.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
