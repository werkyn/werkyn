import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, className, disabled }: DatePickerProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (date: string | null) => {
    setLocal(date);
    onChange(date);
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <input
        type="date"
        value={local ?? ""}
        onChange={(e) => handleChange(e.target.value || null)}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
      {local && !disabled && (
        <button
          type="button"
          onClick={() => handleChange(null)}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
