import { Button } from "@/components/ui/button";
import { Hash, Lock, Users, Settings } from "lucide-react";
import type { ChatChannel } from "../api";

interface ChannelHeaderProps {
  channel: ChatChannel;
  onSettingsClick?: () => void;
}

export function ChannelHeader({ channel, onSettingsClick }: ChannelHeaderProps) {
  const icon = channel.type === "PRIVATE" ? Lock : Hash;
  const Icon = icon;

  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        {channel.type !== "DM" && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
        <h2 className="text-sm font-semibold truncate">
          {channel.name || "Direct Message"}
        </h2>
        {channel.description && (
          <span className="hidden md:block text-xs text-muted-foreground truncate max-w-xs">
            — {channel.description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
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
