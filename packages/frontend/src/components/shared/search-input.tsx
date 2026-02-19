import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [internal, setInternal] = useState(value)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Sync external value changes
  useEffect(() => {
    setInternal(value)
  }, [value])

  // Debounced output
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internal !== value) {
        onChangeRef.current(internal)
      }
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [internal, debounceMs, value])

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <input
        type="text"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-48 rounded-md border border-input bg-transparent pl-7 pr-7 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      {internal && (
        <button
          type="button"
          onClick={() => {
            setInternal("")
            onChangeRef.current("")
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
