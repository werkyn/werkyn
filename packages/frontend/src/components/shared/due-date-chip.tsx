import { isPast, isToday, formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface DueDateChipProps {
  dueDate: string;
  className?: string;
}

export function DueDateChip({ dueDate, className }: DueDateChipProps) {
  const date = parseISO(dueDate);
  const today = isToday(date);
  const overdue = isPast(date) && !today;

  const colorClass = overdue
    ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950"
    : today
      ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950"
      : "text-muted-foreground bg-muted";

  const label = today
    ? "Today"
    : overdue
      ? `${formatDistanceToNow(date)} ago`
      : formatDistanceToNow(date, { addSuffix: true });

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
        colorClass,
        className,
      )}
    >
      <Calendar className="h-3 w-3" />
      {label}
    </span>
  );
}
