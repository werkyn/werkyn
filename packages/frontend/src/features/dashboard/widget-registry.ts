import {
  Star,
  MessageSquare,
  BookOpen,
  Clock,
  CalendarDays,
  BarChart3,
  PenLine,
  AtSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WidgetConfigItem } from "./api";

export interface WidgetDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const GRID_WIDGETS: WidgetDefinition[] = [
  { id: "starred-files", label: "Starred Files", icon: Star },
  { id: "unread-chats", label: "Unread Chats", icon: MessageSquare },
  { id: "recent-wiki", label: "Recent Wiki Edits", icon: BookOpen },
  { id: "time-tracking", label: "Time Tracking", icon: Clock },
  { id: "upcoming-dates", label: "Upcoming Dates", icon: CalendarDays },
  { id: "workspace-stats", label: "Workspace Stats", icon: BarChart3 },
  { id: "recent-files", label: "Recent Files", icon: Clock },
  { id: "my-wiki-edits", label: "My Wiki Edits", icon: PenLine },
  { id: "mentions", label: "Mentions", icon: AtSign },
];

export const DEFAULT_WIDGET_ORDER: WidgetConfigItem[] = GRID_WIDGETS.map(
  (w) => ({ id: w.id, enabled: true }),
);
