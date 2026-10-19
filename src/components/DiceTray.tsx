import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DieFace from './DieFace'
import type { DiceState } from '../lib/dice'
import './DiceTray.css'

const ROLL_COOLDOWN_MS = 2000
const ROLL_ANIM_MS = 1000

// Each physical cube face always shows the same pip value (front=1, back=6, right=2, left=5,
// top=3, bottom=4) — only the cube's rotation changes between rolls. Rotating to REST_ROTATION[v]
// brings the face printed with value v square to the viewer; verified empirically against this
// exact face assignment before shipping (rotateX(0) rotateY(0) -> front=1, rotateY(180) -> 6, etc).
const CUBE_FACES: { cls: string; value: number }[] = [
  { cls: 'f-front', value: 1 },
  { cls: 'f-back', value: 6 },
  { cls: 'f-right', value: 2 },
  { cls: 'f-left', value: 5 },
  { cls: 'f-top', value: 3 },
  { cls: 'f-bottom', value: 4 },
]

const REST_ROTATION: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
}

function randomSign(): 1 | -1 {
  return Math.random() < 0.5 ? 1 : -1
}

// --- Procedural dice-clatter sound (Web Audio, synthesized — no audio asset to ship/license) ---
let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

function playClack(ctx: AudioContext, time: number, freq: number, q: number, decay: number, gain: number) {
  const dur = decay * 3 + 0.02
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, time)
  g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.001), time + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, time + decay)
  noise.connect(filter).connect(g).connect(ctx.destination)
  noise.start(time)
  noise.stop(time + dur)
}

/** A dense cluster of small clacks that thins out and fades — like a handful of dice tumbling
 * together and settling on a table. */
function playDiceRollSound() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const now = ctx.currentTime + 0.01
  let t = 0
  for (let i = 0; i < 13; i++) {
    const progress = i / 13
    t += 0.02 + progress * 0.09
    playClack(ctx, now + t, 700 + Math.random() * 900, 1 + Math.random() * 1.5, 0.015 + Math.random() * 0.02, 0.4 * (1 - progress) + 0.06)
  }
}

interface DiceTrayProps {
  dice: DiceState
  onRoll: () => void
  onToggleHold: (index: number) => void
  // True once the active player has already filled (or crossed) a cell this turn — rolling and
  // holding are both pointless past that point (the turn's result is locked in), but without this
  // the button stayed enabled whenever dice.rollsUsed was still under 3, which is exactly what
  // happens on a "servit" fill (confirmed after just the first roll).
  locked?: boolean
}

export default function DiceTray({ dice, onRoll, onToggleHold, locked = false }: DiceTrayProps) {
  const { t } = useTranslation()
  const [cooldownMs, setCooldownMs] = useState(0)
  // Gates the click synchronously, independent of React's render timing — the `disabled`
  // attribute alone doesn't stop a second click fired before the re-render commits (easy to
  // land with a fast mouse double-click, much less so with a finger tap).
  const lockedUntilRef = useRef(0)

  // Roll animation: real 3D cubes rotated via CSS transitions set directly on the DOM (imperative,
  // not React state) so the browser interpolates the spin itself — no rAF polling needed. Each
  // roll targets the exact resting rotation for the real result, plus a few random extra full
  // turns purely for visual spin; the transition always lands exactly on the correct face.
  const cubeRefs = useRef<(HTMLDivElement | null)[]>([])
  const hopRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevRollsUsedRef = useRef(dice.rollsUsed)

  useEffect(() => {
    const prevRollsUsed = prevRollsUsedRef.current
    prevRollsUsedRef.current = dice.rollsUsed
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Fresh turn, mount, or a re-render that isn't an actual new roll — snap every cube straight
    // to the real face, no transition.
    if (dice.rollsUsed === 0 || dice.rollsUsed <= prevRollsUsed) {
      dice.faces.forEach((face, i) => {
        const cube = cubeRefs.current[i]
        if (!cube) return
        const rest = REST_ROTATION[face]
        cube.style.transition = 'none'
        cube.style.transform = `rotateX(${rest.x}deg) rotateY(${rest.y}deg)`
      })
      return
    }

    dice.faces.forEach((face, i) => {
      if (dice.held[i]) return // frozen — leave its current rotation untouched
      const cube = cubeRefs.current[i]
      const hop = hopRefs.current[i]
      if (!cube) return
      const rest = REST_ROTATION[face]
      if (reduceMotion) {
        cube.style.transition = 'none'
        cube.style.transform = `rotateX(${rest.x}deg) rotateY(${rest.y}deg)`
        return
      }
      const targetX = rest.x + 360 * randomSign()
      const targetY = rest.y + 360 * 3 * randomSign()
      cube.style.transition = `transform ${ROLL_ANIM_MS}ms cubic-bezier(.22,1,.36,1)`
      void cube.offsetWidth
      cube.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`
      if (hop) {
        hop.classList.remove('rolling')
        void hop.offsetWidth
        hop.classList.add('rolling')
      }
    })
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

  const canRoll = !locked && dice.rollsUsed < 3 && cooldownMs <= 0
  const rollLabel =
    cooldownMs > 0
      ? t('diceTray.cooldownLabel', { seconds: Math.ceil(cooldownMs / 1000) })
      : dice.rollsUsed === 0
        ? t('diceTray.rollFirst')
        : t('diceTray.rollAgain', { used: dice.rollsUsed })

  function handleRollClick() {
    const now = Date.now()
    if (locked || now < lockedUntilRef.current || dice.rollsUsed >= 3) return
    lockedUntilRef.current = now + ROLL_COOLDOWN_MS
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && (dice.rollsUsed === 0 || dice.held.some((h) => !h))) {
      playDiceRollSound()
    }
    onRoll()
  }

  return (
    <div className="dice-tray">
      <div className="dice-row">
        {dice.faces.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`die-wrap ${dice.held[i] ? 'held' : ''}`}
            onClick={() => onToggleHold(i)}
            disabled={locked || dice.rollsUsed === 0}
          >
            <span className="die3d-hop" ref={(el) => { hopRefs.current[i] = el }}>
              <span className="die3d-cube" ref={(el) => { cubeRefs.current[i] = el }}>
                {CUBE_FACES.map(({ cls, value }) => (
                  <span key={cls} className={`die3d-face ${cls}`}>
                    <DieFace face={value} size={40} pipColor="var(--navy)" />
                  </span>
                ))}
              </span>
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
