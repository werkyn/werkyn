import { useUnreadCounts, useChannels, type ChatChannel } from "@/features/chat/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useMemo } from "react";

function getDmName(channel: ChatChannel, currentUserId: string | undefined) {
  if (!channel.members) return "Direct Message";
  const other = channel.members.find((m) => m.userId !== currentUserId);
  return other?.user.displayName ?? "Direct Message";
}

interface UnreadChatsWidgetProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function UnreadChatsWidget({ workspaceId, workspaceSlug }: UnreadChatsWidgetProps) {
  const user = useAuthStore((s) => s.user);
  const { data: unreadData, isLoading: unreadLoading } = useUnreadCounts(workspaceId);
  const { data: channelsData, isLoading: channelsLoading } = useChannels(workspaceId);

  const isLoading = unreadLoading || channelsLoading;

  const unreadChannels = useMemo(() => {
    const unreads = unreadData?.data ?? [];
    const channels = channelsData?.data ?? [];
    if (unreads.length === 0 || channels.length === 0) return [];

    const channelMap = new Map(channels.map((c) => [c.id, c]));
    return unreads
      .filter((u) => u.count > 0)
      .map((u) => ({
        ...u,
        channel: channelMap.get(u.channelId),
      }))
      .filter((u) => u.channel != null)
      .sort((a, b) => b.count - a.count);
  }, [unreadData, channelsData]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Unread Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-8" />
              </div>
            ))}
          </div>
        ) : unreadChannels.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">All caught up</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {unreadChannels.map((item) => {
              const channel = item.channel!;
              const name =
                channel.type === "DM"
                  ? getDmName(channel, user?.id)
                  : `#${channel.name}`;

              return (
                <Link
                  key={item.channelId}
                  to="/$workspaceSlug/chat"
                  params={{ workspaceSlug }}
                  search={{ channelId: item.channelId }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <span className="flex-1 min-w-0 truncate font-medium">{name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                    {item.count}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
