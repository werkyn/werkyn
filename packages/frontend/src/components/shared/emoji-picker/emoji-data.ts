import emojiData from "unicode-emoji-json/data-by-emoji.json";
import { GROUP_TO_CATEGORY, KEYWORD_ALIASES } from "./emoji-constants";
import type { EmojiEntry } from "./types";

interface RawEmoji {
  name: string;
  slug: string;
  group: string;
  emoji_version: string;
  unicode_version: string;
  skin_tone_support: boolean;
}

let _entries: EmojiEntry[] | null = null;
let _searchIndex: Map<string, EmojiEntry[]> | null = null;

export function getEmojiEntries(): EmojiEntry[] {
  if (_entries) return _entries;

  _entries = [];
  for (const [char, raw] of Object.entries(
    emojiData as Record<string, RawEmoji>,
  )) {
    const category = GROUP_TO_CATEGORY[raw.group];
    if (!category) continue;
    _entries.push({
      emoji: char,
      name: raw.name,
      slug: raw.slug,
      category,
      skinToneSupport: raw.skin_tone_support,
    });
  }
  return _entries;
}

export function getSearchIndex(): Map<string, EmojiEntry[]> {
  if (_searchIndex) return _searchIndex;

  const entries = getEmojiEntries();
  _searchIndex = new Map();

  const addToIndex = (word: string, entry: EmojiEntry) => {
    const existing = _searchIndex!.get(word);
    if (existing) {
      existing.push(entry);
    } else {
      _searchIndex!.set(word, [entry]);
    }
  };

  for (const entry of entries) {
    // Index each word from the name
    const words = entry.name.toLowerCase().split(/[\s_-]+/);
    for (const word of words) {
      if (word.length > 0) {
        addToIndex(word, entry);
      }
    }

    // Index keyword aliases
    for (const [alias, keywords] of Object.entries(KEYWORD_ALIASES)) {
      const nameLC = entry.name.toLowerCase();
      if (nameLC.includes(alias) || keywords.some((k) => nameLC.includes(k))) {
        addToIndex(alias, entry);
        for (const kw of keywords) {
          addToIndex(kw, entry);
        }
      }
    }
  }

  return _searchIndex;
}

export function searchEmojis(query: string): EmojiEntry[] {
  if (!query.trim()) return [];

  const index = getSearchIndex();
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  if (words.length === 1) {
    // Single word: prefix match across all index keys
    const results = new Set<EmojiEntry>();
    for (const [key, entries] of index) {
      if (key.startsWith(words[0])) {
        for (const e of entries) results.add(e);
      }
    }
    return [...results];
  }

  // Multi-word: intersect results for each word
  const sets = words.map((word) => {
    const matched = new Set<EmojiEntry>();
    for (const [key, entries] of index) {
      if (key.startsWith(word)) {
        for (const e of entries) matched.add(e);
      }
    }
    return matched;
  });

  // Intersect all sets
  const result = [...sets[0]].filter((entry) =>
    sets.every((s) => s.has(entry)),
  );
  return result;
}

export function applyTone(emoji: string, toneIndex: number): string {
  if (toneIndex === 0) return emoji;
  const modifier = [
    "\u{1F3FB}",
    "\u{1F3FC}",
    "\u{1F3FD}",
    "\u{1F3FE}",
    "\u{1F3FF}",
  ][toneIndex - 1];
  if (!modifier) return emoji;

  // For ZWJ sequences, insert modifier after the first codepoint
  const codepoints = [...emoji];
  if (codepoints.length === 1) {
    return emoji + modifier;
  }

  // Insert after first codepoint (before ZWJ or variation selector)
  return codepoints[0] + modifier + codepoints.slice(1).join("");
}
