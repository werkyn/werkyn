import type { Task } from "@/features/tasks/api";

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const PRIORITY_DOT_COLORS: Record<string, string> = {
  URGENT: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#3b82f6",
  LOW: "#9ca3af",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function buildEventTooltip(task: Task): string {
  const parts: string[] = [];

  // Title
  parts.push(
    `<div style="font-weight:600;font-size:13px;margin-bottom:6px">${escapeHtml(task.title)}</div>`,
  );

  // Status
  const statusColor = task.status.color || "#9ca3af";
  parts.push(
    `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">` +
      `<span style="width:8px;height:8px;border-radius:50%;background:${statusColor};flex-shrink:0"></span>` +
      `<span style="font-size:12px">${escapeHtml(task.status.name)}</span>` +
      `</div>`,
  );

  // Priority
  const priColor = PRIORITY_DOT_COLORS[task.priority] ?? PRIORITY_DOT_COLORS.MEDIUM;
  const priLabel = PRIORITY_LABELS[task.priority] ?? "Medium";
  parts.push(
    `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">` +
      `<span style="width:8px;height:8px;border-radius:50%;background:${priColor};flex-shrink:0"></span>` +
      `<span style="font-size:12px">${priLabel} priority</span>` +
      `</div>`,
  );

  // Date range
  if (task.startDate || task.dueDate) {
    let dateText: string;
    if (task.startDate && task.dueDate && task.startDate !== task.dueDate) {
      dateText = `${formatShortDate(task.startDate)} – ${formatShortDate(task.dueDate)}`;
    } else {
      dateText = formatShortDate((task.startDate ?? task.dueDate)!);
    }
    parts.push(
      `<div style="font-size:12px;margin-bottom:4px;color:hsl(var(--muted-foreground))">${dateText}</div>`,
    );
  }

  // Assignees
  if (task.assignees.length > 0) {
    const names = task.assignees.map((a) => escapeHtml(a.user.displayName)).join(", ");
    parts.push(
      `<div style="font-size:12px;margin-bottom:4px;color:hsl(var(--muted-foreground))">${names}</div>`,
    );
  }

  // Labels
  if (task.labels.length > 0) {
    const pills = task.labels
      .map(
        (l) =>
          `<span style="display:inline-block;padding:1px 6px;border-radius:9999px;font-size:11px;background:${l.label.color};color:#fff;margin-right:4px">${escapeHtml(l.label.name)}</span>`,
      )
      .join("");
    parts.push(`<div style="margin-bottom:4px">${pills}</div>`);
  }

  // Description (strip HTML, truncate)
  if (task.description) {
    const plain = stripHtml(task.description);
    if (plain) {
      const truncated = plain.length > 100 ? plain.slice(0, 100) + "…" : plain;
      parts.push(
        `<div style="font-size:11px;color:hsl(var(--muted-foreground));margin-top:2px">${escapeHtml(truncated)}</div>`,
      );
    }
  }

  return `<div style="max-width:280px;padding:4px 2px">${parts.join("")}</div>`;
}
