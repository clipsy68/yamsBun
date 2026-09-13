import { useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

interface UseLongPressOptions {
  onTap?: () => void
  onLongPress?: () => void
  delay?: number
}

/** Combines tap and press-and-hold into one set of pointer handlers, so only one fires per gesture. */
export function useLongPress({ onTap, onLongPress, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedRef = useRef(false)

  function clear() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function onPointerDown() {
    firedRef.current = false
    clear()
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      onLongPress?.()
    }, delay)
  }

  function onPointerUp() {
    clear()
    if (!firedRef.current) onTap?.()
  }

  function onPointerLeave() {
    clear()
  }

  function onPointerCancel() {
    clear()
  }

  function onContextMenu(e: ReactMouseEvent) {
    e.preventDefault()
  }

  return { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, onContextMenu }
}
