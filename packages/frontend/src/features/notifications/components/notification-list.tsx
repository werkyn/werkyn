import { useNotifications, useMarkNotificationsRead, useMarkAllRead } from "../api";
import { NotificationItem } from "./notification-item";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Check } from "lucide-react";
import type { Notification } from "../api";

interface NotificationListProps {
  onClose: () => void;
}

export function NotificationList({ onClose }: NotificationListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useNotifications();
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllRead();
  const navigate = useNavigate();
  const { workspaceSlug } = useParams({ strict: false }) as {
    workspaceSlug?: string;
  };

  const notifications = data?.pages.flatMap((p) => p.data) ?? [];

  const handleClick = (notification: Notification) => {
    if (!notification.read) {
      markRead.mutate([notification.id]);
    }
    // Navigate to the task's project if data is available
    const d = notification.data as Record<string, string> | null;
    if (d?.projectId && workspaceSlug) {
      navigate({
        to: "/$workspaceSlug/projects/$projectId/board",
        params: { workspaceSlug, projectId: d.projectId },
        search: d.taskId ? { task: d.taskId } : {},
      });
    }
    onClose();
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
          >
            <Check className="h-3 w-3" />
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1 p-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                <div className="h-7 w-7 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={handleClick}
              />
            ))}
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-2 text-center text-xs text-muted-foreground hover:bg-accent transition-colors"
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
