import { CATEGORIES } from "./emoji-constants";
import type { EmojiCategory } from "./types";
import { cn } from "@/lib/utils";

interface EmojiCategoryNavProps {
  activeCategory: EmojiCategory;
  hasRecents: boolean;
  onCategoryClick: (key: EmojiCategory) => void;
}

export function EmojiCategoryNav({
  activeCategory,
  hasRecents,
  onCategoryClick,
}: EmojiCategoryNavProps) {
  const categories = hasRecents
    ? CATEGORIES
    : CATEGORIES.filter((c) => c.key !== "recently-used");

  return (
    <div className="flex shrink-0 flex-col gap-0.5 border-r p-1">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.key;
        return (
          <button
            key={cat.key}
            type="button"
            title={cat.label}
            onClick={() => onCategoryClick(cat.key)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded transition-colors",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
