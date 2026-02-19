// Week utilities — weeks start on Monday

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getSunday(monday: Date): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  return d;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseWeekParam(week?: string): Date {
  if (week) {
    const d = new Date(week + "T00:00:00");
    if (!isNaN(d.getTime())) return getMonday(d);
  }
  return getMonday(new Date());
}

export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function formatShortDate(date: Date): string {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  return `${weekday} ${day}`;
}

export function formatMonthRange(monday: Date, sunday: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = monday.toLocaleDateString("en-US", opts);
  const end = sunday.toLocaleDateString("en-US", { ...opts, year: "numeric" });
  return `${start} – ${end}`;
}

/** Get first day of current month as YYYY-MM-DD */
export function getMonthStart(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Get last day of current month as YYYY-MM-DD */
export function getMonthEnd(date: Date): string {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return formatDateISO(last);
}
