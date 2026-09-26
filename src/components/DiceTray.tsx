import { useEffect, useRef, useState } from 'react'
import DieFace from './DieFace'
import type { DiceState } from '../lib/dice'
import './DiceTray.css'

const ROLL_COOLDOWN_MS = 3000

interface DiceTrayProps {
  dice: DiceState
  onRoll: () => void
  onToggleHold: (index: number) => void
}

export default function DiceTray({ dice, onRoll, onToggleHold }: DiceTrayProps) {
  const [cooldownMs, setCooldownMs] = useState(0)
  // Gates the click synchronously, independent of React's render timing — the `disabled`
  // attribute alone doesn't stop a second click fired before the re-render commits (easy to
  // land with a fast mouse double-click, much less so with a finger tap).
  const lockedUntilRef = useRef(0)

  // After every roll but the first, disable the button for a few seconds so an accidental
  // tap can't re-roll before the player has had a chance to pick which dice to hold.
  useEffect(() => {
    if (dice.rollsUsed === 0) {
      setCooldownMs(0)
      return
    }
    setCooldownMs(ROLL_COOLDOWN_MS)
    const start = Date.now()
    const interval = setInterval(() => {
      const remaining = ROLL_COOLDOWN_MS - (Date.now() - start)
      if (remaining <= 0) {
        setCooldownMs(0)
        clearInterval(interval)
      } else {
        setCooldownMs(remaining)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [dice.rollsUsed])

  const canRoll = dice.rollsUsed < 3 && cooldownMs <= 0
  const rollLabel =
    cooldownMs > 0
      ? `Selectează zarurile de păstrat... (${Math.ceil(cooldownMs / 1000)})`
      : dice.rollsUsed === 0
        ? 'Aruncă zarurile'
        : `Aruncă din nou (${dice.rollsUsed}/3)`

  function handleRollClick() {
    const now = Date.now()
    if (now < lockedUntilRef.current || dice.rollsUsed >= 3) return
    lockedUntilRef.current = now + ROLL_COOLDOWN_MS
    onRoll()
  }

  return (
    <div className="dice-tray">
      <div className="dice-row">
        {dice.faces.map((face, i) => (
          <button
            key={i}
            type="button"
            className={`die-wrap ${dice.held[i] ? 'held' : ''}`}
            onClick={() => onToggleHold(i)}
            disabled={dice.rollsUsed === 0}
          >
            <DieFace face={face} size={40} pipColor="var(--navy)" />
            {dice.held[i] && (
              <span className="hold-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="white" strokeWidth="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="2" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
      <button type="button" className="roll-btn" onClick={handleRollClick} disabled={!canRoll}>
        {rollLabel}
      </button>
    </div>
  )
}
