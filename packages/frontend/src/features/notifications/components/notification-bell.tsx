import { Bell } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useUnreadCount } from "../api";
import { NotificationList } from "./notification-list";
import { useState } from "react";

export function NotificationBell() {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-md p-1.5 hover:bg-accent transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <NotificationList onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
