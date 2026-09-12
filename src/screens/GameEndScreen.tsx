import GeneralScoreTable from '../components/GeneralScoreTable'
import { useGame } from '../state/GameContext'
import { playerGrandTotal } from '../lib/scoring'
import './GameEndScreen.css'

export default function GameEndScreen() {
  const { players, dispatch } = useGame()
  const ranked = [...players].sort((a, b) => playerGrandTotal(b.table) - playerGrandTotal(a.table))
  const winner = ranked[0]

  return (
    <div className="ge-screen">
      <div className="ge-topbar">
        <div className="ge-trophy">
          <TrophyIcon color="var(--green)" />
        </div>
        <div>
          <div className="ge-t1">Joc încheiat</div>
          <div className="ge-t2">{players.map((p) => p.name).join(', ')}</div>
        </div>
      </div>

      <div className="ge-content">
        <div className="ge-page">
          <GeneralScoreTable players={players} highlightedId={undefined} />

          <div className="ge-totals-row">
            {ranked.map((p) => (
              <div className={`ge-totals-card ${p === winner ? 'winner' : ''}`} key={p.id}>
                <div className="ge-totals-name-row">
                  {p === winner && <TrophyIcon color="var(--green)" size={14} />}
                  <div className="ge-totals-name">{p.name}</div>
                </div>
                <div className="ge-totals-score">{playerGrandTotal(p.table)} p</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ge-actions">
          <button className="ge-btn-new" onClick={() => dispatch({ type: 'NEW_GAME' })}>
            Joc nou
          </button>
          <button className="ge-btn-history" onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'history' } })}>
            Vezi istoricul
          </button>
        </div>
      </div>
    </div>
  )
}

function TrophyIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V4Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 20h6M12 13v7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
