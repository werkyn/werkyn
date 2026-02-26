import { useMemo } from "react";
import { searchEmojis, getEmojiEntries } from "./emoji-data";
import type { EmojiEntry, EmojiCategory } from "./types";
import { CATEGORIES } from "./emoji-constants";

export interface GroupedEmojis {
  key: EmojiCategory;
  label: string;
  emojis: EmojiEntry[];
}

export function useEmojiSearch(
  query: string,
  recentEmojis: EmojiEntry[],
): { groups: GroupedEmojis[]; isSearching: boolean } {
  return useMemo(() => {
    if (query.trim()) {
      const results = searchEmojis(query);
      return {
        groups:
          results.length > 0
            ? [{ key: "smileys-emotion" as EmojiCategory, label: "Search Results", emojis: results }]
            : [],
        isSearching: true,
      };
    }

    const entries = getEmojiEntries();
    const byCategory = new Map<EmojiCategory, EmojiEntry[]>();
    for (const entry of entries) {
      const list = byCategory.get(entry.category);
      if (list) {
        list.push(entry);
      } else {
        byCategory.set(entry.category, [entry]);
      }
    }

    const groups: GroupedEmojis[] = [];

    // Add recently used first (if any)
    if (recentEmojis.length > 0) {
      groups.push({
        key: "recently-used",
        label: "Recently Used",
        emojis: recentEmojis,
      });
    }

    // Add categories in order
    for (const cat of CATEGORIES) {
      if (cat.key === "recently-used") continue;
      const emojis = byCategory.get(cat.key);
      if (emojis && emojis.length > 0) {
        groups.push({
          key: cat.key,
          label: cat.label,
          emojis,
        });
      }
    }

    return { groups, isSearching: false };
  }, [query, recentEmojis]);
}
