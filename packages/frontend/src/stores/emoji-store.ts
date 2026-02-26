import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EmojiState {
  frequencyMap: Record<string, number>;
  skinTone: number;
  recordUsage: (emoji: string) => void;
  setSkinTone: (tone: number) => void;
  getRecentEmojis: () => string[];
}

const MAX_RECENT = 24;

export const useEmojiStore = create<EmojiState>()(
  persist(
    (set, get) => ({
      frequencyMap: {},
      skinTone: 0,
      recordUsage: (emoji: string) => {
        set((state) => ({
          frequencyMap: {
            ...state.frequencyMap,
            [emoji]: (state.frequencyMap[emoji] ?? 0) + 1,
          },
        }));
      },
      setSkinTone: (tone: number) => {
        set({ skinTone: tone });
      },
      getRecentEmojis: () => {
        const { frequencyMap } = get();
        return Object.entries(frequencyMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, MAX_RECENT)
          .map(([emoji]) => emoji);
      },
    }),
    { name: "pm-emoji" },
  ),
);
