import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DieFace from './DieFace'
import type { DiceState } from '../lib/dice'
import './DiceTray.css'

const ROLL_COOLDOWN_MS = 2000

interface DiceTrayProps {
  dice: DiceState
  onRoll: () => void
  onToggleHold: (index: number) => void
}

export default function DiceTray({ dice, onRoll, onToggleHold }: DiceTrayProps) {
  const { t } = useTranslation()
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
      // A fresh turn's dice reset rollsUsed to 0, but this component instance (and its ref) can
      // outlive the turn that set it — without this, a quick pass to the next player within 3s of
      // the previous player's last roll silently eats their first tap: the button looks enabled
      // (cooldownMs is reset above) but handleRollClick's own gate still sees the stale deadline.
      lockedUntilRef.current = 0
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
      ? t('diceTray.cooldownLabel', { seconds: Math.ceil(cooldownMs / 1000) })
      : dice.rollsUsed === 0
        ? t('diceTray.rollFirst')
        : t('diceTray.rollAgain', { used: dice.rollsUsed })

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
            {/* Keyed on rollsUsed only while unheld, so only a die that actually got a new face
                this roll remounts and replays the settle animation — a held die's key stays put. */}
            <span className="die-face" key={dice.held[i] ? 'held' : dice.rollsUsed}>
              <DieFace face={face} size={40} pipColor="var(--navy)" />
            </span>
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
