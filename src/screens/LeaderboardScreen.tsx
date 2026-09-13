import { useState } from 'react'
import { listSavedPlayers } from '../lib/players'
import { useGame } from '../state/GameContext'
import './LeaderboardScreen.css'

export default function LeaderboardScreen() {
  const { dispatch } = useGame()
  const [players] = useState(() =>
    listSavedPlayers().sort((a, b) => b.gamesWon - a.gamesWon || b.gamesPlayed - a.gamesPlayed),
  )
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="lb-screen">
      <div className="lb-topbar">
        <button className="lb-back-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'start' } })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="lb-title">Clasament jucători</div>
      </div>

      {players.length === 0 && <div className="lb-empty">Niciun jucător salvat încă — jucați un joc pentru a începe clasamentul.</div>}

      <div className="lb-list">
        {players.map((p, i) => (
          <button
            type="button"
            className="lb-row"
            key={p.name}
            onClick={() => setExpanded((cur) => (cur === p.name ? null : p.name))}
          >
            <div className="lb-rank">{i + 1}</div>
            <div className="lb-name-col">
              <div className="lb-name">{p.name}</div>
              {expanded === p.name && (
                <div className="lb-stats">
                  {p.gamesPlayed} {p.gamesPlayed === 1 ? 'joc jucat' : 'jocuri jucate'} · {p.gamesWon}{' '}
                  {p.gamesWon === 1 ? 'câștigat' : 'câștigate'}
                </div>
              )}
            </div>
            <div className="lb-wins">{p.gamesWon}p</div>
          </button>
        ))}
      </div>
    </div>
  )
}
