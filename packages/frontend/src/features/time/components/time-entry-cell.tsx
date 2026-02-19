import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TimeEntryCellProps {
  hours: number;
  onChange: (hours: number) => void;
  readOnly?: boolean;
}

export function TimeEntryCell({ hours, onChange, readOnly }: TimeEntryCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleStartEdit() {
    if (readOnly) return;
    setValue(hours > 0 ? String(hours) : "");
    setEditing(true);
  }

  function handleBlur() {
    setEditing(false);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 24) {
      if (parsed !== hours) {
        onChange(parsed);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="0"
        max="24"
        step="0.25"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-16 h-8 text-center text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className={cn(
        "w-16 h-8 text-center text-sm rounded-md transition-colors",
        readOnly
          ? "cursor-default"
          : "hover:bg-accent cursor-pointer",
        hours > 0 ? "font-medium" : "text-muted-foreground",
      )}
    >
      {hours > 0 ? hours.toFixed(hours % 1 === 0 ? 0 : 2) : "–"}
    </button>
  );
}
