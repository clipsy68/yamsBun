import { useEffect, useRef, useState } from 'react'
import { ROLL_ANIM_MS } from '../components/DiceTray'

/**
 * True once the dice-roll animation for the current rollsUsed has had time to actually settle —
 * used to delay Learning-mode suggestions so they don't reveal the answer on the score table while
 * DiceTray's cubes are still visually tumbling. Mirrors DiceTray's own "was this a real new roll"
 * check (rollsUsed strictly increasing) so mounting mid-turn, or a turn reset to 0, never applies a
 * phantom delay for an animation that isn't actually playing; also resolves instantly under
 * prefers-reduced-motion, since DiceTray itself skips the animation then.
 */
export function useSuggestionsReady(rollsUsed: number): boolean {
  const [ready, setReady] = useState(true)
  const prevRollsUsedRef = useRef(rollsUsed)

  useEffect(() => {
    const prevRollsUsed = prevRollsUsedRef.current
    prevRollsUsedRef.current = rollsUsed
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (rollsUsed === 0 || rollsUsed <= prevRollsUsed || reduceMotion) {
      setReady(true)
      return
    }

    setReady(false)
    const id = setTimeout(() => setReady(true), ROLL_ANIM_MS)
    return () => clearTimeout(id)
  }, [rollsUsed])

  return ready
}
