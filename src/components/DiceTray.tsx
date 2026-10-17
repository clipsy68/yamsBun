import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DieFace from './DieFace'
import type { DiceState } from '../lib/dice'
import './DiceTray.css'

const ROLL_COOLDOWN_MS = 2000
const FLICKER_DURATION_MS = 700
const FLICKER_TICK_MS = 65

function randomFaceExcluding(exclude: number): number {
  let f: number
  do {
    f = 1 + Math.floor(Math.random() * 6)
  } while (f === exclude)
  return f
}

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

  // Roll animation: while "rolling", each unheld die flickers through random faces at a steady
  // pace with a shared tilt wobble that decays to flat — not a 3D flip, so nothing ever rotates
  // out of view. displayFaces is what's actually rendered; dice.faces (the real result) only
  // becomes visible once the flicker settles.
  const [displayFaces, setDisplayFaces] = useState(dice.faces)
  const [wobbleDeg, setWobbleDeg] = useState(0)
  const prevRollsUsedRef = useRef(dice.rollsUsed)
  const rafRef = useRef<number | null>(null)
  // Always-current refs so the running rAF loop reacts to a hold toggled mid-flicker (freezing
  // that die from the next tick on) instead of restarting — the effect below intentionally only
  // keys on rollsUsed, not on dice.held/dice.faces, to avoid aborting an in-flight animation.
  const heldRef = useRef(dice.held)
  const facesRef = useRef(dice.faces)
  heldRef.current = dice.held
  facesRef.current = dice.faces

  useEffect(() => {
    const prevRollsUsed = prevRollsUsedRef.current
    prevRollsUsedRef.current = dice.rollsUsed
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    // Fresh turn, or a re-render that isn't an actual new roll — snap to the real faces, no flicker.
    if (dice.rollsUsed === 0 || dice.rollsUsed <= prevRollsUsed) {
      setDisplayFaces(dice.faces)
      setWobbleDeg(0)
      rafRef.current = null
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayFaces(dice.faces)
      setWobbleDeg(0)
      rafRef.current = null
      return
    }

    const start = performance.now()
    let lastTick = 0
    const frame = (now: number) => {
      const elapsed = now - start
      if (elapsed - lastTick >= FLICKER_TICK_MS && elapsed < FLICKER_DURATION_MS) {
        lastTick = elapsed
        const amp = 10 * (1 - elapsed / FLICKER_DURATION_MS)
        setWobbleDeg(Math.sin(elapsed / 55) * amp)
        setDisplayFaces((prev) => prev.map((f, i) => (heldRef.current[i] ? facesRef.current[i] : randomFaceExcluding(f))))
      }
      if (elapsed < FLICKER_DURATION_MS) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        setDisplayFaces(facesRef.current)
        setWobbleDeg(0)
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [dice.rollsUsed])

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
        {displayFaces.map((face, i) => (
          <button
            key={i}
            type="button"
            className={`die-wrap ${dice.held[i] ? 'held' : ''}`}
            onClick={() => onToggleHold(i)}
            disabled={dice.rollsUsed === 0}
          >
            <span className="die-face" style={dice.held[i] ? undefined : { transform: `rotate(${wobbleDeg}deg)` }}>
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
