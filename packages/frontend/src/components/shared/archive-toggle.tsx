import { cn } from "@/lib/utils"

interface ArchiveToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}

export function ArchiveToggle({
  checked,
  onChange,
  label = "Archived",
  className,
}: ArchiveToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-input accent-primary"
      />
      {label}
    </label>
  )
}
