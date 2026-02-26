import { Search, X } from "lucide-react";
import { forwardRef } from "react";

interface EmojiSearchProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const EmojiSearch = forwardRef<HTMLInputElement, EmojiSearchProps>(
  ({ value, onChange, onKeyDown }, ref) => {
    return (
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search emoji..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  },
);

EmojiSearch.displayName = "EmojiSearch";
