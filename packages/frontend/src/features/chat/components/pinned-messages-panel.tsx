import { X, Pin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { usePinnedMessages, useTogglePin, type ChatMessage } from "../api";

interface PinnedMessagesPanelProps {
  workspaceId: string;
  channelId: string;
  currentUserId: string;
  isAdmin?: boolean;
  onClose: () => void;
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

export function PinnedMessagesPanel({
  workspaceId,
  channelId,
  currentUserId,
  isAdmin,
  onClose,
}: PinnedMessagesPanelProps) {
  const { data, isLoading } = usePinnedMessages(workspaceId, channelId);
  const togglePin = useTogglePin(workspaceId, channelId);
  const messages = data?.data ?? [];

  return (
    <div className="flex flex-col h-full w-80 border-l bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Pin className="h-3.5 w-3.5" />
          Pinned Messages
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
        ) : messages.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            No pinned messages
          </p>
        ) : (
          <div className="divide-y">
            {messages.map((msg) => (
              <div key={msg.id} className="px-4 py-3 hover:bg-accent/50 transition-colors">
                <div className="flex items-start gap-2">
                  <UserAvatar
                    displayName={msg.user.displayName}
                    avatarUrl={msg.user.avatarUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">
                        {msg.user.displayName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-0.5">
                      {msg.content}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    title="Unpin"
                    onClick={() =>
                      togglePin.mutate({ messageId: msg.id, pinned: false })
                    }
                    disabled={togglePin.isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
