import DieFace from './DieFace'
import type { DiceState } from '../lib/dice'
import './DiceTray.css'

interface DiceTrayProps {
  dice: DiceState
  onRoll: () => void
  onToggleHold: (index: number) => void
}

export default function DiceTray({ dice, onRoll, onToggleHold }: DiceTrayProps) {
  const canRoll = dice.rollsUsed < 3
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
      <button type="button" className="roll-btn" onClick={onRoll} disabled={!canRoll}>
        {dice.rollsUsed === 0 ? 'Aruncă zarurile' : `Aruncă din nou (${dice.rollsUsed}/3)`}
      </button>
    </div>
  )
}
