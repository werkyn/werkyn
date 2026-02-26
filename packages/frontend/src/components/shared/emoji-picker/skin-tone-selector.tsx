import { cn } from "@/lib/utils";
import { SKIN_TONE_LABELS, SKIN_TONE_PREVIEW } from "./emoji-constants";

interface SkinToneSelectorProps {
  value: number;
  onChange: (tone: number) => void;
  onClose: () => void;
}

export function SkinToneSelector({
  value,
  onChange,
  onClose,
}: SkinToneSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-popover p-1 shadow-sm">
      {SKIN_TONE_PREVIEW.map((preview, i) => (
        <button
          key={i}
          type="button"
          title={SKIN_TONE_LABELS[i]}
          onClick={() => {
            onChange(i);
            onClose();
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded text-base transition-colors",
            value === i
              ? "bg-accent ring-1 ring-ring"
              : "hover:bg-accent/50",
          )}
        >
          {preview}
        </button>
      ))}
    </div>
  );
}
