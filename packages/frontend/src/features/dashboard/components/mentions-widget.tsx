import { useMentionNotifications } from "@/features/dashboard/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { AtSign } from "lucide-react";

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

interface MentionsWidgetProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function MentionsWidget({ workspaceId: _workspaceId, workspaceSlug }: MentionsWidgetProps) {
  const { data: mentions, isLoading } = useMentionNotifications();
  const items = mentions ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AtSign className="h-4 w-4" />
          Mentions
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
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No mentions yet</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {items.map((notification) => {
              const data = notification.data as Record<string, string> | null;
              const isChatMention = notification.type === "CHAT_MENTION";

              const linkProps = isChatMention
                ? {
                    to: "/$workspaceSlug/chat" as const,
                    params: { workspaceSlug },
                    search: data?.channelId ? { channelId: data.channelId } : {},
                  }
                : {
                    to: "/$workspaceSlug" as const,
                    params: { workspaceSlug },
                    search: data?.taskId ? { task: data.taskId } : {},
                  };

              return (
                <Link
                  key={notification.id}
                  {...linkProps}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors -mx-2"
                >
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="truncate block font-medium">{notification.title}</span>
                    {notification.body && (
                      <span className="text-xs text-muted-foreground truncate block">
                        {notification.body}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {timeAgo(notification.createdAt)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
