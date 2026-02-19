import { UserPlus, ArrowRightLeft, Clock, MessageSquare, AtSign } from "lucide-react";
import type { Notification } from "../api";

const TYPE_ICONS: Record<string, typeof UserPlus> = {
  TASK_ASSIGNED: UserPlus,
  TASK_STATUS_CHANGED: ArrowRightLeft,
  TASK_DUE_SOON: Clock,
  COMMENT_ADDED: MessageSquare,
  COMMENT_MENTION: AtSign,
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type] || MessageSquare;

  return (
    <button
      onClick={() => onClick(notification)}
      className={`flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors ${
        !notification.read ? "bg-accent/50" : ""
      }`}
    >
      <div className="mt-0.5 flex-shrink-0 rounded-full bg-muted p-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-tight ${!notification.read ? "font-medium" : "text-muted-foreground"}`}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" aria-label="Unread" />
      )}
    </button>
  );
}
