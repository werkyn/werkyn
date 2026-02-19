import { useEffect, type RefObject } from "react"

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  callback: () => void,
) {
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback()
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [ref, callback])
}
