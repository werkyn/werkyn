import { useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { MessageItem } from "./message-item";
import type { ChatMessage } from "../api";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  isAdmin?: boolean;
  activeThreadId?: string | null;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  memberMap?: Map<string, string>;
  onLoadMore?: () => void;
  onThreadClick?: (messageId: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onPin?: (messageId: string, pinned: boolean) => void;
  onBookmark?: (messageId: string) => void;
  onAttach?: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  isAdmin,
  activeThreadId,
  hasMore,
  isFetchingMore,
  memberMap,
  onLoadMore,
  onThreadClick,
  onEditMessage,
  onDeleteMessage,
  onReaction,
  onPin,
  onBookmark,
  onAttach,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const prevMessageCount = useRef(messages.length);

  // Scroll to bottom on new messages (if user was already at bottom)
  useEffect(() => {
    if (messages.length > prevMessageCount.current && isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Track if user is at bottom
    isAtBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 50;

    // Load more when scrolled to top
    if (el.scrollTop < 100 && hasMore && !isFetchingMore) {
      onLoadMore?.();
    }
  }, [hasMore, isFetchingMore, onLoadMore]);

  // Messages come in newest-first from API, reverse for display
  const displayMessages = [...messages].reverse();

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      onScroll={handleScroll}
    >
      {/* Load more indicator at top */}
      {isFetchingMore && (
        <div className="flex justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {hasMore && !isFetchingMore && (
        <div className="flex justify-center py-2">
          <button
            onClick={onLoadMore}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Load older messages
          </button>
        </div>
      )}

      {displayMessages.length === 0 && (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      )}

      <div className="py-2">
        {displayMessages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isActiveThread={activeThreadId === msg.id}
            memberMap={memberMap}
            onThreadClick={onThreadClick}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
            onReaction={onReaction}
            onPin={onPin}
            onBookmark={onBookmark}
            onAttach={onAttach}
          />
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
