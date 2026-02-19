import { useState, useRef, useEffect } from "react";

interface InlineEditCellProps {
  value: string;
  canEdit: boolean;
  onSave: (value: string) => void;
  type?: "text" | "select";
  options?: Array<{ value: string; label: string }>;
}

export function InlineEditCell({
  value,
  canEdit,
  onSave,
  type = "text",
  options,
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSave = () => {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  };

  if (!canEdit) {
    return <span className="truncate">{value}</span>;
  }

  if (editing) {
    if (type === "select" && options) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setEditing(false);
            if (e.target.value !== value) {
              onSave(e.target.value);
            }
          }}
          onBlur={handleSave}
          className="w-full rounded border border-input bg-transparent px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="w-full rounded border border-input bg-transparent px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className="truncate cursor-text hover:bg-accent/50 rounded px-1 -mx-1"
    >
      {value || "\u00A0"}
    </span>
  );
}
