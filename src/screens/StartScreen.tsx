import { useState } from 'react'
import { useGame } from '../state/GameContext'
import './StartScreen.css'

const PLAYER_COUNTS = [2, 3, 4, 5, 6]

export default function StartScreen() {
  const { dispatch } = useGame()
  const [playerCount, setPlayerCount] = useState(2)
  const [gameType, setGameType] = useState<'fizic' | 'virtual'>('fizic')
  const [names, setNames] = useState<string[]>(['', ''])
  const [showLiveTotal, setShowLiveTotal] = useState(false)

  function handlePlayerCount(n: number) {
    setPlayerCount(n)
    setNames((prev) => {
      const next = prev.slice(0, n)
      while (next.length < n) next.push('')
      return next
    })
  }

  function handleNameChange(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)))
  }

  const canStart = names.every((n) => n.trim().length > 0)

  return (
    <div className="start-screen">
      <div className="topbar">
        <div className="brand">Yams</div>
        <div className="topbar-actions">
          <button
            className="info-btn"
            onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'history' } })}
            aria-label="Istoric jocuri"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="info-btn"
            onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'rules', from: { name: 'start' } } })}
            aria-label="Regulile jocului"
          >
            i
          </button>
        </div>
      </div>

      <section>
        <div className="label">Număr jucători</div>
        <div className="chip-row">
          {PLAYER_COUNTS.map((n) => (
            <button
              key={n}
              className={`chip ${n === playerCount ? 'selected' : 'idle'}`}
              onClick={() => handlePlayerCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="label">Tip joc</div>
        <div className="type-row">
          <button
            className={`type-card ${gameType === 'fizic' ? 'selected' : 'idle'}`}
            onClick={() => setGameType('fizic')}
          >
            <div className="type-title">Zaruri fizice</div>
            <div className="type-sub">Aruncă zaruri reale și introdu manual rezultatul</div>
          </button>
          <button
            className={`type-card ${gameType === 'virtual' ? 'selected' : 'idle'}`}
            onClick={() => setGameType('virtual')}
          >
            <div className="type-title">Zaruri virtuale</div>
            <div className="type-sub">Aplicația aruncă zarurile, cu animație</div>
          </button>
        </div>
      </section>

      <section>
        <div className="label">Nume jucători</div>
        <div className="hint">Completează în ordinea așezării jucătorilor</div>
        <div className="name-list">
          {names.map((name, i) => (
            <div className="name-row" key={i}>
              <div className="name-badge">{i + 1}</div>
              <input
                className="name-input"
                placeholder={`Nume jucător ${i + 1}`}
                value={name}
                onChange={(e) => handleNameChange(i, e.target.value)}
                maxLength={24}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <label className="toggle-row">
          <button
            type="button"
            className={`checkbox ${showLiveTotal ? 'checked' : ''}`}
            onClick={() => setShowLiveTotal((v) => !v)}
            aria-pressed={showLiveTotal}
          />
          <div className="toggle-text">
            <div className="toggle-title">Afișează scorul total general în timp real</div>
            <div className="toggle-sub">
              Opțional — ținut ascuns până la final e mai captivant, dar poți porni afișarea live oricând.
            </div>
          </div>
        </label>
      </section>

      <div className="spacer" />
      <button
        className="start-btn"
        disabled={!canStart}
        onClick={() => dispatch({ type: 'START_GAME', setup: { playerCount, gameType, names, showLiveTotal } })}
      >
        Start joc
      </button>
    </div>
  )
}
