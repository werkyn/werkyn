import { cn } from "@/lib/utils";
import { Hash, Lock, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { ChatChannel, UnreadCount } from "../api";

interface ChannelListProps {
  channels: ChatChannel[];
  activeChannelId?: string;
  unreadCounts: UnreadCount[];
  currentUserId: string;
  dmMembers?: Record<string, Array<{ id: string; displayName: string; avatarUrl: string | null }>>;
  onChannelClick: (channelId: string) => void;
  onCreateChannel: () => void;
  onCreateDm: () => void;
}

export function ChannelList({
  channels,
  activeChannelId,
  unreadCounts,
  currentUserId,
  dmMembers = {},
  onChannelClick,
  onCreateChannel,
  onCreateDm,
}: ChannelListProps) {
  const publicChannels = channels.filter((c) => c.type === "PUBLIC");
  const privateChannels = channels.filter((c) => c.type === "PRIVATE");
  const dmChannels = channels.filter((c) => c.type === "DM");
  const unreadMap = new Map(unreadCounts.map((u) => [u.channelId, u.count]));

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Channels section */}
      <div className="p-3">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Channels
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={onCreateChannel}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-0.5">
          {publicChannels.map((ch) => (
            <ChannelItem
              key={ch.id}
              channel={ch}
              active={ch.id === activeChannelId}
              unread={unreadMap.get(ch.id) ?? 0}
              onClick={() => onChannelClick(ch.id)}
            />
          ))}
          {privateChannels.map((ch) => (
            <ChannelItem
              key={ch.id}
              channel={ch}
              active={ch.id === activeChannelId}
              unread={unreadMap.get(ch.id) ?? 0}
              onClick={() => onChannelClick(ch.id)}
            />
          ))}
        </div>
      </div>

      {/* DMs section */}
      <div className="p-3 pt-0">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Direct Messages
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={onCreateDm}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-0.5">
          {dmChannels.map((ch) => {
            const members = dmMembers[ch.id] ?? [];
            const otherMembers = members.filter((m) => m.id !== currentUserId);
            const displayName = otherMembers.length > 0
              ? otherMembers.map((m) => m.displayName).join(", ")
              : "You";
            const firstOther = otherMembers[0];

            return (
              <button
                key={ch.id}
                onClick={() => onChannelClick(ch.id)}
                className={cn(
                  "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left",
                  ch.id === activeChannelId && "bg-accent font-medium",
                )}
              >
                {firstOther ? (
                  <UserAvatar
                    displayName={firstOther.displayName}
                    avatarUrl={firstOther.avatarUrl}
                    size="sm"
                  />
                ) : (
                  <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate flex-1">{displayName}</span>
                <UnreadBadge count={unreadMap.get(ch.id) ?? 0} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChannelItem({
  channel,
  active,
  unread,
  onClick,
}: {
  channel: ChatChannel;
  active: boolean;
  unread: number;
  onClick: () => void;
}) {
  const Icon = channel.type === "PRIVATE" ? Lock : Hash;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left",
        active && "bg-accent font-medium",
        unread > 0 && !active && "font-medium",
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="truncate flex-1">{channel.name}</span>
      <UnreadBadge count={unread} />
    </button>
  );
}

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
