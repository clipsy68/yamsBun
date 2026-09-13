import { useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

interface UseLongPressOptions {
  onTap?: () => void
  onLongPress?: () => void
  delay?: number
}

/**
 * Combines tap and press-and-hold into one set of handlers, so only one fires per gesture.
 * Tap goes through the browser's native click synthesis (not raw pointerup) so it still gets
 * the browser's own scroll-vs-tap disambiguation inside a scrollable ancestor — a horizontally
 * scrollable table can otherwise swallow a tap detected purely from pointerdown/pointerup.
 */
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
    clear()
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      onLongPress?.()
    }, delay)
  }

  function onPointerUp() {
    clear()
  }

  function onPointerLeave() {
    clear()
  }

  function onPointerCancel() {
    clear()
  }

  function onClick() {
    if (firedRef.current) {
      firedRef.current = false
      return
    }
    onTap?.()
  }

  function onContextMenu(e: ReactMouseEvent) {
    e.preventDefault()
  }

  return { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, onClick, onContextMenu }
}
