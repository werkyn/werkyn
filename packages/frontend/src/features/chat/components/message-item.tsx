import { useState, useMemo } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Pencil,
  Trash2,
  X,
  Check,
  SmilePlus,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/shared/emoji-picker";
import type { ChatMessage } from "../api";

interface MessageItemProps {
  message: ChatMessage;
  currentUserId: string;
  isAdmin?: boolean;
  isActiveThread?: boolean;
  onThreadClick?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessageItem({
  message,
  currentUserId,
  isAdmin,
  isActiveThread,
  onThreadClick,
  onEdit,
  onDelete,
  onReaction,
}: MessageItemProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const isOwn = message.userId === currentUserId;
  const isDeleted = !!message.deletedAt;

  const handleSaveEdit = () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === message.content) {
      setEditing(false);
      return;
    }
    onEdit?.(message.id, trimmed);
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      setEditing(false);
      setEditContent(message.content);
    }
  };

  // Group reactions by emoji: { emoji, count, userIds, reacted }
  const groupedReactions = useMemo(() => {
    if (!message.reactions?.length) return [];
    const map = new Map<
      string,
      { emoji: string; count: number; userIds: string[]; reacted: boolean }
    >();
    for (const r of message.reactions) {
      const existing = map.get(r.emoji);
      if (existing) {
        existing.count++;
        existing.userIds.push(r.userId);
        if (r.userId === currentUserId) existing.reacted = true;
      } else {
        map.set(r.emoji, {
          emoji: r.emoji,
          count: 1,
          userIds: [r.userId],
          reacted: r.userId === currentUserId,
        });
      }
    }
    return Array.from(map.values());
  }, [message.reactions, currentUserId]);

  const hasActions =
    !isDeleted &&
    !editing &&
    (onThreadClick ||
      onReaction ||
      (isOwn && onEdit) ||
      ((isOwn || isAdmin) && onDelete));

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-1.5 transition-colors",
        isActiveThread
          ? "bg-primary/10 border-l-2 border-primary"
          : "hover:bg-accent/50",
      )}
    >
      {/* Floating action toolbar */}
      {hasActions && (
        <div className={cn("absolute top-1/2 -translate-y-1/2 right-4 items-center gap-0.5 rounded-md border bg-background shadow-sm px-1 py-0.5 z-10", emojiPickerOpen ? "flex" : "hidden group-hover:flex")}>
          {onReaction && (
            <EmojiPicker
              value={null}
              onChange={(emoji) => {
                if (emoji) onReaction(message.id, emoji);
              }}
              onOpenChange={setEmojiPickerOpen}
            >
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                title="Add reaction"
              >
                <SmilePlus className="h-3.5 w-3.5" />
              </Button>
            </EmojiPicker>
          )}
          {onThreadClick && !message.parentId && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onThreadClick(message.id)}
              title="Reply in thread"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          )}
          {isOwn && onEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                setEditing(true);
                setEditContent(message.content);
              }}
              title="Edit message"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {(isOwn || isAdmin) && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(message.id)}
              title="Delete message"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      <UserAvatar
        displayName={message.user.displayName}
        avatarUrl={message.user.avatarUrl}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            {message.user.displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(message.createdAt)} {formatTime(message.createdAt)}
          </span>
          {message.editedAt && !isDeleted && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {isDeleted ? (
          <p className="text-sm text-muted-foreground italic">
            This message was deleted.
          </p>
        ) : editing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="min-h-[40px] max-h-32 resize-none"
              rows={1}
              autoFocus
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setEditContent(message.content);
                }}
              >
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                <Check className="h-3 w-3 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Reactions */}
        {!isDeleted && groupedReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {groupedReactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReaction?.(message.id, r.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                  r.reacted
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border hover:bg-accent",
                )}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread reply count */}
        {!isDeleted &&
          !editing &&
          message._count &&
          message._count.replies > 0 &&
          onThreadClick && (
            <button
              onClick={() => onThreadClick(message.id)}
              className="mt-0.5 text-xs text-primary hover:underline"
            >
              {message._count.replies}{" "}
              {message._count.replies === 1 ? "reply" : "replies"}
            </button>
          )}
      </div>
    </div>
  );
}
