import { useEffect, useRef, useState } from 'react'

export function useToast(timeoutMs = 1800) {
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function showToast(message: string) {
    setToast(message)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), timeoutMs)
  }

  return { toast, showToast }
}
