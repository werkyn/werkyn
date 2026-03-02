import { Button } from "@/components/ui/button";
import { Hash, Lock, Users, Settings, Search, Pin, Archive } from "lucide-react";
import type { ChatChannel, PresenceUser } from "../api";

interface ChannelHeaderProps {
  channel: ChatChannel;
  pinnedCount?: number;
  presenceStatus?: "online" | "away" | "offline";
  onSettingsClick?: () => void;
  onSearchClick?: () => void;
  onPinsClick?: () => void;
}

export function ChannelHeader({
  channel,
  pinnedCount = 0,
  presenceStatus,
  onSettingsClick,
  onSearchClick,
  onPinsClick,
}: ChannelHeaderProps) {
  const icon = channel.type === "PRIVATE" ? Lock : Hash;
  const Icon = icon;

  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        {channel.type !== "DM" && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
        <h2 className="text-sm font-semibold truncate">
          {channel.name || "Direct Message"}
        </h2>
        {channel.type === "DM" && presenceStatus && presenceStatus !== "offline" && (
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              presenceStatus === "online" ? "bg-green-500" : "bg-yellow-500"
            }`}
            title={presenceStatus}
          />
        )}
        {channel.archivedAt && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            <Archive className="h-3 w-3" />
            Archived
          </span>
        )}
        {channel.description && (
          <span className="hidden md:block text-xs text-muted-foreground truncate max-w-xs">
            — {channel.description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {onSearchClick && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onSearchClick} title="Search messages">
            <Search className="h-3.5 w-3.5" />
          </Button>
        )}
        {onPinsClick && (
          <Button size="icon" variant="ghost" className="h-7 w-7 relative" onClick={onPinsClick} title="Pinned messages">
            <Pin className="h-3.5 w-3.5" />
            {pinnedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                {pinnedCount}
              </span>
            )}
          </Button>
        )}
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          {channel._count.members}
        </span>
        {channel.type !== "DM" && onSettingsClick && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onSettingsClick}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
