import { X, Bookmark, Loader2, Hash, Lock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useBookmarks, useToggleBookmark } from "../api";

interface BookmarksPanelProps {
  workspaceId: string;
  onClose: () => void;
  onNavigate?: (channelId: string) => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookmarksPanel({
  workspaceId,
  onClose,
  onNavigate,
}: BookmarksPanelProps) {
  const { data, isLoading } = useBookmarks(workspaceId);
  const toggleBookmark = useToggleBookmark(workspaceId);
  const bookmarks = data?.data ?? [];

  const getChannelIcon = (type: string) => {
    if (type === "PRIVATE") return Lock;
    if (type === "DM") return MessageCircle;
    return Hash;
  };

  return (
    <div className="flex flex-col h-full w-80 border-l bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Bookmark className="h-3.5 w-3.5" />
          Saved Messages
        </h3>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : bookmarks.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No saved messages
          </p>
        ) : (
          <div className="divide-y">
            {bookmarks.map((bk) => {
              const Icon = getChannelIcon(bk.message.channel.type);
              return (
                <div
                  key={bk.id}
                  className="px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onNavigate?.(bk.message.channel.id)}
                >
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                    <Icon className="h-3 w-3" />
                    <span>{bk.message.channel.name || "Direct Message"}</span>
                    <span className="ml-auto">{formatTime(bk.message.createdAt)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserAvatar
                      displayName={bk.message.user.displayName}
                      avatarUrl={bk.message.user.avatarUrl}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">
                        {bk.message.user.displayName}
                      </span>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {bk.message.content}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      title="Remove bookmark"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark.mutate(bk.messageId);
                      }}
                      disabled={toggleBookmark.isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
