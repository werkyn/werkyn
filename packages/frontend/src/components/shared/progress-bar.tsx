import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  color?: string
  size?: "sm" | "md"
  className?: string
}

export function ProgressBar({
  value,
  color,
  size = "sm",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      className={cn(
        "w-full rounded-full bg-muted overflow-hidden",
        size === "sm" ? "h-1.5" : "h-2.5",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          !color && "bg-primary",
        )}
        style={{
          width: `${clamped}%`,
          ...(color ? { backgroundColor: color } : {}),
        }}
      />
    </div>
  )
}
