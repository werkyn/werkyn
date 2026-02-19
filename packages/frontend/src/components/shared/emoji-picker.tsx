import { useState, useMemo, useRef } from "react";
import { Smile, X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string | null) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😊", "😇", "🙂",
      "😉", "😌", "😍", "🥰", "😎", "🤓", "🧐", "🤔", "🤗", "😤",
    ],
  },
  {
    name: "People",
    emojis: [
      "👋", "🤚", "✋", "🖖", "👌", "🤞", "🤟", "🤘", "👍", "👎",
      "👏", "🙌", "🤝", "💪", "🧠", "👀", "👥", "🧑‍💻", "👤", "🏃",
    ],
  },
  {
    name: "Nature",
    emojis: [
      "🌱", "🌿", "🍀", "🌵", "🌲", "🌳", "🌴", "🌸", "🌺", "🌻",
      "🌍", "🌙", "⭐", "🔥", "💧", "🌈", "❄️", "🌊", "🐶", "🦋",
    ],
  },
  {
    name: "Food",
    emojis: [
      "🍎", "🍊", "🍋", "🍇", "🍓", "🍕", "🍔", "🌮", "🍜", "🍩",
      "☕", "🍵", "🧃", "🍷", "🎂", "🍰", "🧁", "🍫", "🥗", "🧀",
    ],
  },
  {
    name: "Activities",
    emojis: [
      "⚽", "🏀", "🏈", "🎾", "🎯", "🎮", "🎲", "🧩", "🎨", "🎭",
      "🎵", "🎸", "🎹", "🏆", "🥇", "🏅", "🎪", "🎬", "📸", "🎤",
    ],
  },
  {
    name: "Travel",
    emojis: [
      "🚀", "✈️", "🚗", "🚂", "🚢", "🏠", "🏢", "🏗️", "🏰", "🗼",
      "🌆", "🏖️", "🏔️", "⛺", "🗺️", "🧭", "🚦", "⛽", "🚁", "🛸",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "💡", "🔧", "🔨", "⚙️", "🔬", "💻", "📱", "📧", "📝", "📋",
      "📁", "📂", "📊", "📈", "📉", "🗂️", "📌", "📎", "🔑", "🔒",
    ],
  },
  {
    name: "Symbols",
    emojis: [
      "❤️", "💙", "💚", "💛", "💜", "🖤", "🤍", "💯", "✅", "❌",
      "⚠️", "💬", "💭", "🔔", "⏰", "♻️", "🏷️", "🔗", "⚡", "🎉",
    ],
  },
];

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((c) =>
  c.emojis.map((e) => ({ emoji: e, category: c.name })),
);

function EmojiGrid({
  value,
  onSelect,
  onRemove,
}: {
  value: string | null;
  onSelect: (emoji: string) => void;
  onRemove: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return ALL_EMOJIS.filter((e) => e.category.toLowerCase().includes(q));
  }, [search]);

  const displayCategories = activeCategory
    ? EMOJI_CATEGORIES.filter((c) => c.name === activeCategory)
    : EMOJI_CATEGORIES;

  return (
    <>
      <div className="p-2 border-b">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveCategory(null); }}
            placeholder="Filter by category..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={onRemove}
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {!filtered && !activeCategory && (
        <div className="flex flex-wrap gap-1 p-2 border-b">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {activeCategory && (
        <div className="flex items-center gap-1 p-2 border-b">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            All
          </button>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs font-medium">{activeCategory}</span>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto p-2">
        {filtered ? (
          filtered.length > 0 ? (
            <div className="grid grid-cols-8 gap-0.5">
              {filtered.map((e) => (
                <button
                  key={e.emoji}
                  type="button"
                  onClick={() => onSelect(e.emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-accent transition-colors"
                >
                  {e.emoji}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-4">
              No matches
            </p>
          )
        ) : (
          displayCategories.map((cat) => (
            <div key={cat.name} className="mb-2 last:mb-0">
              {!activeCategory && (
                <p className="text-xs font-medium text-muted-foreground mb-1 px-1">
                  {cat.name}
                </p>
              )}
              <div className="grid grid-cols-8 gap-0.5">
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onSelect(emoji)}
                    className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-accent transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export function EmojiPicker({ value, onChange, children, open: controlledOpen, onOpenChange }: EmojiPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); onOpenChange?.(v); };
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  const handleRemove = () => {
    onChange(null);
    setOpen(false);
  };

  // Controlled mode (opened externally, e.g. from dropdown menu)
  if (isControlled) {
    return (
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverAnchor asChild>
          <div ref={anchorRef} />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          side="right"
          className="w-80 p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <EmojiGrid value={value} onSelect={handleSelect} onRemove={handleRemove} />
        </PopoverContent>
      </Popover>
    );
  }

  // Uncontrolled mode (has its own trigger)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <button
            type="button"
            className="flex items-center justify-center rounded-md hover:bg-accent transition-colors"
          >
            {value ? (
              <span className="text-3xl leading-none">{value}</span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <Smile className="h-4 w-4" />
                Add icon
              </span>
            )}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <EmojiGrid value={value} onSelect={handleSelect} onRemove={handleRemove} />
      </PopoverContent>
    </Popover>
  );
}
