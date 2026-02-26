import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmojiStore } from "@/stores/emoji-store";
import { EmojiSearch } from "./emoji-search";
import { EmojiCategoryNav } from "./emoji-category-nav";
import { EmojiGrid, type EmojiGridHandle } from "./emoji-grid";
import { EmojiPreviewFooter } from "./emoji-preview-footer";
import { useEmojiSearch } from "./use-emoji-search";
import { getEmojiEntries, applyTone } from "./emoji-data";
import type { EmojiEntry, EmojiCategory } from "./types";

interface EmojiPickerContentProps {
  value: string | null;
  onSelect: (emoji: string) => void;
  onRemove: () => void;
}

export function EmojiPickerContent({
  value,
  onSelect,
  onRemove,
}: EmojiPickerContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiEntry | null>(null);
  const [activeCategory, setActiveCategory] =
    useState<EmojiCategory>("smileys-emotion");
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<EmojiGridHandle>(null);

  const { skinTone, setSkinTone, recordUsage, getRecentEmojis } =
    useEmojiStore();

  // Build recent emoji entries from the store
  const recentEmojis = useMemo(() => {
    const recentChars = getRecentEmojis();
    if (recentChars.length === 0) return [];
    const allEntries = getEmojiEntries();
    const lookup = new Map(allEntries.map((e) => [e.emoji, e]));
    return recentChars
      .map((char) => lookup.get(char))
      .filter((e): e is EmojiEntry => e !== undefined);
  }, [getRecentEmojis]);

  const { groups, isSearching } = useEmojiSearch(searchQuery, recentEmojis);

  // Focus search input on mount
  useEffect(() => {
    // Small delay to ensure popover is rendered
    const t = setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Reset active index when search changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery]);

  // Set initial active category based on recents
  useEffect(() => {
    if (recentEmojis.length > 0 && !isSearching) {
      setActiveCategory("recently-used");
    }
  }, [recentEmojis.length, isSearching]);

  const handleSelect = useCallback(
    (emoji: string) => {
      // Find base emoji for recording (strip skin tone)
      const allEntries = getEmojiEntries();
      const baseEntry = allEntries.find(
        (e) =>
          e.emoji === emoji ||
          (e.skinToneSupport && applyTone(e.emoji, skinTone) === emoji),
      );
      if (baseEntry) {
        recordUsage(baseEntry.emoji);
      }
      onSelect(emoji);
    },
    [skinTone, recordUsage, onSelect],
  );

  const handleCategoryClick = useCallback(
    (key: EmojiCategory) => {
      setActiveCategory(key);
      gridRef.current?.scrollToCategory(key);
    },
    [],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(0);
        gridRef.current?.focus();
      } else if (e.key === "Escape") {
        if (searchQuery) {
          setSearchQuery("");
        }
      }
    },
    [searchQuery],
  );

  const handleEscapeToSearch = useCallback(() => {
    setActiveIndex(-1);
    searchInputRef.current?.focus();
  }, []);

  const handleSkinToneChange = useCallback(
    (tone: number) => {
      setSkinTone(tone);
    },
    [setSkinTone],
  );

  return (
    <div className="w-[352px]">
      <div className="flex items-center">
        <div className="flex-1">
          <EmojiSearch
            ref={searchInputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 mr-2 text-xs text-muted-foreground"
            onClick={onRemove}
          >
            <X className="h-3 w-3 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <div className="flex">
        {!isSearching && (
          <EmojiCategoryNav
            activeCategory={activeCategory}
            hasRecents={recentEmojis.length > 0}
            onCategoryClick={handleCategoryClick}
          />
        )}
        <div className="flex-1 min-w-0">
          <EmojiGrid
            ref={gridRef}
            groups={groups}
            skinTone={skinTone}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            onSelect={handleSelect}
            onHover={setHoveredEmoji}
            onActiveCategoryChange={setActiveCategory}
            onEscapeToSearch={handleEscapeToSearch}
          />
        </div>
      </div>

      <EmojiPreviewFooter
        hoveredEmoji={hoveredEmoji}
        skinTone={skinTone}
        onSkinToneChange={handleSkinToneChange}
      />
    </div>
  );
}
