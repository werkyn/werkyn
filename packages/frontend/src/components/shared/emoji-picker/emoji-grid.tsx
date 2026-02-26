import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { COLS } from "./emoji-constants";
import { applyTone } from "./emoji-data";
import type { EmojiEntry, EmojiCategory } from "./types";
import type { GroupedEmojis } from "./use-emoji-search";
import { cn } from "@/lib/utils";

interface EmojiGridProps {
  groups: GroupedEmojis[];
  skinTone: number;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect: (emoji: string) => void;
  onHover: (entry: EmojiEntry | null) => void;
  onActiveCategoryChange: (key: EmojiCategory) => void;
  onEscapeToSearch: () => void;
}

export interface EmojiGridHandle {
  scrollToCategory: (key: EmojiCategory) => void;
  focus: () => void;
  flatCount: () => number;
}

export const EmojiGrid = forwardRef<EmojiGridHandle, EmojiGridProps>(
  (
    {
      groups,
      skinTone,
      activeIndex,
      onActiveIndexChange,
      onSelect,
      onHover,
      onActiveCategoryChange,
      onEscapeToSearch,
    },
    ref,
  ) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const isScrollingToCategory = useRef(false);

    // Build flat list for keyboard nav
    const flatList = groups.flatMap((g) => g.emojis);

    useImperativeHandle(ref, () => ({
      scrollToCategory: (key: EmojiCategory) => {
        const el = sectionRefs.current.get(key);
        if (el && scrollRef.current) {
          isScrollingToCategory.current = true;
          const top = el.offsetTop - scrollRef.current.offsetTop;
          scrollRef.current.scrollTo({ top, behavior: "smooth" });
          // Reset flag after scroll completes
          setTimeout(() => {
            isScrollingToCategory.current = false;
          }, 400);
        }
      },
      focus: () => containerRef.current?.focus(),
      flatCount: () => flatList.length,
    }));

    // Scroll-spy via IntersectionObserver
    useEffect(() => {
      const root = scrollRef.current;
      if (!root) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (isScrollingToCategory.current) return;
          // Find the topmost visible sentinel
          let topEntry: IntersectionObserverEntry | null = null;
          for (const entry of entries) {
            if (entry.isIntersecting) {
              if (
                !topEntry ||
                entry.boundingClientRect.top < topEntry.boundingClientRect.top
              ) {
                topEntry = entry;
              }
            }
          }
          if (topEntry) {
            const key = (topEntry.target as HTMLElement).dataset
              .category as EmojiCategory;
            if (key) onActiveCategoryChange(key);
          }
        },
        {
          root,
          rootMargin: "-10% 0px -80% 0px",
          threshold: 0,
        },
      );

      for (const el of sectionRefs.current.values()) {
        observer.observe(el);
      }

      return () => observer.disconnect();
    }, [groups, onActiveCategoryChange]);

    // Auto-scroll active emoji into view
    useEffect(() => {
      if (activeIndex < 0) return;
      const el = containerRef.current?.querySelector(
        `[data-index="${activeIndex}"]`,
      );
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    }, [activeIndex]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const total = flatList.length;
        if (total === 0) return;

        let next = activeIndex;

        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            next = activeIndex < total - 1 ? activeIndex + 1 : activeIndex;
            break;
          case "ArrowLeft":
            e.preventDefault();
            next = activeIndex > 0 ? activeIndex - 1 : 0;
            break;
          case "ArrowDown":
            e.preventDefault();
            next =
              activeIndex + COLS < total ? activeIndex + COLS : activeIndex;
            break;
          case "ArrowUp":
            e.preventDefault();
            if (activeIndex - COLS < 0) {
              onEscapeToSearch();
              return;
            }
            next = activeIndex - COLS;
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < total) {
              const entry = flatList[activeIndex];
              const rendered = entry.skinToneSupport
                ? applyTone(entry.emoji, skinTone)
                : entry.emoji;
              onSelect(rendered);
            }
            return;
          case "Escape":
            e.preventDefault();
            onEscapeToSearch();
            return;
          default:
            return;
        }

        onActiveIndexChange(next);
        // Update hover preview to match keyboard nav
        if (next >= 0 && next < total) {
          onHover(flatList[next]);
        }
      },
      [
        activeIndex,
        flatList,
        skinTone,
        onActiveIndexChange,
        onSelect,
        onHover,
        onEscapeToSearch,
      ],
    );

    let globalIndex = 0;

    return (
      <div
        ref={scrollRef}
        className="max-h-[280px] min-h-[200px] overflow-y-auto overflow-x-hidden"
      >
        <div
          ref={containerRef}
          role="grid"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="outline-none p-1"
          aria-activedescendant={
            activeIndex >= 0 ? `emoji-${activeIndex}` : undefined
          }
        >
          {groups.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No emoji found
            </p>
          )}
          {groups.map((group) => {
            const startIndex = globalIndex;
            return (
              <div key={group.key} className="mb-1 last:mb-0">
                <div
                  ref={(el) => {
                    if (el) sectionRefs.current.set(group.key, el);
                  }}
                  data-category={group.key}
                  className="sticky top-0 z-10 bg-popover/95 backdrop-blur-sm px-1 py-1"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.label}
                  </span>
                </div>
                <div className="grid grid-cols-8 gap-0">
                  {group.emojis.map((entry) => {
                    const idx = globalIndex++;
                    const isActive = idx === activeIndex;
                    const rendered = entry.skinToneSupport
                      ? applyTone(entry.emoji, skinTone)
                      : entry.emoji;
                    return (
                      <button
                        key={`${entry.emoji}-${idx - startIndex}`}
                        id={`emoji-${idx}`}
                        role="gridcell"
                        type="button"
                        data-index={idx}
                        onClick={() => onSelect(rendered)}
                        onMouseEnter={() => onHover(entry)}
                        onMouseLeave={() => onHover(null)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded text-lg transition-colors",
                          isActive
                            ? "bg-accent ring-2 ring-ring"
                            : "hover:bg-accent",
                        )}
                      >
                        {rendered}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

EmojiGrid.displayName = "EmojiGrid";
