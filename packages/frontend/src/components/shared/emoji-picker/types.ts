import type { LucideIcon } from "lucide-react";

export interface EmojiEntry {
  emoji: string;
  name: string;
  slug: string;
  category: EmojiCategory;
  skinToneSupport: boolean;
}

export type EmojiCategory =
  | "recently-used"
  | "smileys-emotion"
  | "people-body"
  | "animals-nature"
  | "food-drink"
  | "travel-places"
  | "activities"
  | "objects"
  | "symbols"
  | "flags";

export interface CategoryMeta {
  key: EmojiCategory;
  label: string;
  icon: LucideIcon;
}
