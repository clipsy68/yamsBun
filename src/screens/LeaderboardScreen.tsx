import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listSavedPlayers } from '../lib/players'
import { useGame } from '../state/GameContext'
import './LeaderboardScreen.css'

export default function LeaderboardScreen() {
  const { t } = useTranslation()
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
        <div className="lb-title">{t('leaderboard.title')}</div>
      </div>

      {players.length === 0 && <div className="lb-empty">{t('leaderboard.empty')}</div>}

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
                  {t('leaderboard.gamesPlayed', { count: p.gamesPlayed })} · {t('leaderboard.gamesWon', { count: p.gamesWon })}
                </div>
              )}
            </div>
            <div className="lb-wins">{t('leaderboard.winsBadge', { count: p.gamesWon })}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
