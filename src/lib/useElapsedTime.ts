import { useEffect, useState } from 'react'
import { formatElapsed } from './format'

/** Ticks once a second while `startedAt` is set, returning the formatted elapsed time (or null if not running). */
export function useElapsedTime(startedAt: number | null): string | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  if (startedAt === null) return null
  return formatElapsed(now - startedAt)
}
