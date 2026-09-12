import { useState } from 'react'
import { deleteHistoryEntry, listHistory } from '../lib/storage'
import { useGame } from '../state/GameContext'
import './HistoryScreen.css'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function HistoryScreen() {
  const { dispatch } = useGame()
  const [entries, setEntries] = useState(listHistory())

  function handleDelete(id: string) {
    deleteHistoryEntry(id)
    setEntries(listHistory())
  }

  return (
    <div className="hs-screen">
      <div className="hs-topbar">
        <button
          className="hs-back-btn"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'start' } })}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="hs-title">Istoric jocuri</div>
      </div>

      {entries.length === 0 && <div className="hs-empty">Niciun joc încheiat încă.</div>}

      <div className="hs-list">
        {entries.map((e) => (
          <div className="hs-entry" key={e.id}>
            <button
              type="button"
              className="hs-entry-main"
              onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'historyDetail', id: e.id } })}
            >
              <div className="hs-date">{formatDate(e.date)}</div>
              <div className="hs-players">{e.players.map((p) => p.name).join(', ')}</div>
              <div className="hs-winner">
                <TrophyIcon />
                <div className="hs-who">{e.winnerName}</div>
                <div className="hs-score">{e.winnerScore}p</div>
              </div>
            </button>
            <button type="button" className="hs-delete-btn" onClick={() => handleDelete(e.id)} aria-label="Șterge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a2 2 0 0 1-2 1.9H9.8a2 2 0 0 1-2-1.9L7 7"
                  stroke="var(--red)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V4Z" stroke="var(--orange-soft)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 20h6M12 13v7" stroke="var(--orange-soft)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
