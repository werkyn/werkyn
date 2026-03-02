import { useNotificationPreference, useUpdateNotificationPreference } from "../api";
import { Bell } from "lucide-react";

const TIMING_OPTIONS = [
  { value: "on_due_date", label: "On due date" },
  { value: "1_day_before", label: "1 day before" },
  { value: "3_days_before", label: "3 days before" },
  { value: "1_week_before", label: "1 week before" },
] as const;

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export function NotificationSettings() {
  const { data: pref, isLoading } = useNotificationPreference();
  const update = useUpdateNotificationPreference();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-3 animate-pulse">
            <div className="space-y-1">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
            <div className="h-5 w-9 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!pref) return null;

  const items = [
    {
      key: "taskAssigned" as const,
      label: "Task assigned",
      description: "When someone assigns you to a task",
    },
    {
      key: "taskStatusChanged" as const,
      label: "Task status changed",
      description: "When a task you're assigned to changes status",
    },
    {
      key: "taskDueSoon" as const,
      label: "Task due soon",
      description: "Reminders for upcoming due dates",
    },
    {
      key: "commentAdded" as const,
      label: "New comment",
      description: "When someone comments on your task",
    },
    {
      key: "commentMention" as const,
      label: "Mentions",
      description: "When someone @mentions you in a comment",
    },
    {
      key: "chatMention" as const,
      label: "Chat mentions",
      description: "When someone @mentions you in a chat message",
    },
    {
      key: "chatDmMessage" as const,
      label: "Direct messages",
      description: "When someone sends you a direct message",
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Notifications</h2>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between rounded-lg border px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
            <Toggle
              checked={pref[item.key]}
              onChange={(v) => update.mutate({ [item.key]: v })}
              disabled={update.isPending}
              label={item.label}
            />
          </div>
        ))}

        <div className="rounded-lg border px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Due date reminder timing</p>
              <p className="text-xs text-muted-foreground">
                When to send due date reminders
              </p>
            </div>
            <select
              aria-label="Due date reminder timing"
              value={pref.dueDateReminderTiming}
              onChange={(e) =>
                update.mutate({
                  dueDateReminderTiming: e.target.value as
                    | "on_due_date"
                    | "1_day_before"
                    | "3_days_before"
                    | "1_week_before",
                })
              }
              disabled={update.isPending}
              className="rounded-md border bg-transparent px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              {TIMING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
