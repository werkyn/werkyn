import { useState } from "react";
import { applyTone } from "./emoji-data";
import { SkinToneSelector } from "./skin-tone-selector";
import { SKIN_TONE_PREVIEW } from "./emoji-constants";
import type { EmojiEntry } from "./types";

interface EmojiPreviewFooterProps {
  hoveredEmoji: EmojiEntry | null;
  skinTone: number;
  onSkinToneChange: (tone: number) => void;
}

export function EmojiPreviewFooter({
  hoveredEmoji,
  skinTone,
  onSkinToneChange,
}: EmojiPreviewFooterProps) {
  const [showSkinTones, setShowSkinTones] = useState(false);

  const displayEmoji = hoveredEmoji
    ? hoveredEmoji.skinToneSupport
      ? applyTone(hoveredEmoji.emoji, skinTone)
      : hoveredEmoji.emoji
    : null;

  return (
    <div className="flex items-center justify-between border-t px-3 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        {displayEmoji ? (
          <>
            <span className="text-2xl leading-none shrink-0">
              {displayEmoji}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {hoveredEmoji!.name}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            Pick an emoji...
          </span>
        )}
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          title="Skin tone"
          onClick={() => setShowSkinTones(!showSkinTones)}
          className="flex h-7 w-7 items-center justify-center rounded text-base hover:bg-accent transition-colors"
        >
          {SKIN_TONE_PREVIEW[skinTone]}
        </button>
        {showSkinTones && (
          <div className="absolute bottom-full right-0 mb-1 z-10">
            <SkinToneSelector
              value={skinTone}
              onChange={onSkinToneChange}
              onClose={() => setShowSkinTones(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
