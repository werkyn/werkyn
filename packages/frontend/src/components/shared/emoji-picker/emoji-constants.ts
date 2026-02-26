import {
  Clock,
  Smile,
  User,
  Leaf,
  UtensilsCrossed,
  Plane,
  Trophy,
  Lightbulb,
  Hash,
  Flag,
} from "lucide-react";
import type { CategoryMeta, EmojiCategory } from "./types";

export const CATEGORIES: CategoryMeta[] = [
  { key: "recently-used", label: "Recently Used", icon: Clock },
  { key: "smileys-emotion", label: "Smileys & Emotion", icon: Smile },
  { key: "people-body", label: "People & Body", icon: User },
  { key: "animals-nature", label: "Animals & Nature", icon: Leaf },
  { key: "food-drink", label: "Food & Drink", icon: UtensilsCrossed },
  { key: "travel-places", label: "Travel & Places", icon: Plane },
  { key: "activities", label: "Activities", icon: Trophy },
  { key: "objects", label: "Objects", icon: Lightbulb },
  { key: "symbols", label: "Symbols", icon: Hash },
  { key: "flags", label: "Flags", icon: Flag },
];

export const GROUP_TO_CATEGORY: Record<string, EmojiCategory> = {
  "Smileys & Emotion": "smileys-emotion",
  "People & Body": "people-body",
  "Animals & Nature": "animals-nature",
  "Food & Drink": "food-drink",
  "Travel & Places": "travel-places",
  Activities: "activities",
  Objects: "objects",
  Symbols: "symbols",
  Flags: "flags",
};

export const SKIN_TONE_MODIFIERS = [
  "", // default (no modifier)
  "\u{1F3FB}", // light
  "\u{1F3FC}", // medium-light
  "\u{1F3FD}", // medium
  "\u{1F3FE}", // medium-dark
  "\u{1F3FF}", // dark
] as const;

export const SKIN_TONE_LABELS = [
  "Default",
  "Light",
  "Medium-Light",
  "Medium",
  "Medium-Dark",
  "Dark",
] as const;

export const SKIN_TONE_PREVIEW = ["✋", "✋🏻", "✋🏼", "✋🏽", "✋🏾", "✋🏿"] as const;

export const KEYWORD_ALIASES: Record<string, string[]> = {
  "+1": ["thumbs up", "thumbsup", "like", "approve"],
  "-1": ["thumbs down", "thumbsdown", "dislike", "disapprove"],
  fire: ["flame", "hot", "lit"],
  heart: ["love", "like"],
  laugh: ["lol", "haha", "funny"],
  cry: ["sad", "tear"],
  think: ["thinking", "hmm"],
  ok: ["okay", "fine", "good"],
  wave: ["hello", "hi", "bye", "goodbye"],
  clap: ["applause", "bravo"],
  pray: ["please", "hope", "wish", "namaste"],
  rocket: ["launch", "ship"],
  star: ["favorite", "fave"],
  check: ["done", "complete", "yes"],
  x: ["no", "wrong", "cross", "cancel"],
  bug: ["insect", "debug"],
  bulb: ["idea", "lightbulb"],
  eyes: ["look", "see", "watch"],
  100: ["perfect", "hundred"],
  party: ["celebrate", "celebration", "tada"],
};

export const COLS = 8;
