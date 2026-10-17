import { useTranslation } from 'react-i18next'
import GeneralScoreTable from '../components/GeneralScoreTable'
import { useGame } from '../state/GameContext'
import { playerGrandTotal } from '../lib/scoring'
import './GameEndScreen.css'

export default function GameEndScreen() {
  const { t } = useTranslation()
  const { players, dispatch } = useGame()
  const ranked = [...players].sort((a, b) => playerGrandTotal(b.table) - playerGrandTotal(a.table))
  const topScore = playerGrandTotal(ranked[0].table)
  const winners = ranked.filter((p) => playerGrandTotal(p.table) === topScore)
  const isTie = winners.length > 1

  return (
    <div className="ge-screen">
      <div className="ge-topbar">
        <div className="ge-trophy">
          <TrophyIcon color="var(--green)" />
        </div>
        <div>
          <div className="ge-t1">{isTie ? t('gameEnd.titleTie') : t('gameEnd.title')}</div>
          <div className="ge-t2">{players.map((p) => p.name).join(', ')}</div>
        </div>
      </div>

      <div className="ge-content">
        <div className="ge-page">
          <div className="ge-table-wrap">
            <GeneralScoreTable players={players} highlightedId={undefined} />
          </div>

          <div className="ge-totals-row">
            {ranked.map((p) => (
              <div className={`ge-totals-card ${winners.includes(p) ? 'winner' : ''}`} key={p.id}>
                <div className="ge-totals-name-row">
                  {winners.includes(p) && <TrophyIcon color="var(--green)" size={14} />}
                  <div className="ge-totals-name">{p.name}</div>
                </div>
                <div className="ge-totals-score">{t('common.scoreSuffix', { score: playerGrandTotal(p.table) })}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ge-actions">
          <button className="ge-btn-new" onClick={() => dispatch({ type: 'NEW_GAME' })}>
            {t('gameEnd.newGame')}
          </button>
          <button className="ge-btn-history" onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'history' } })}>
            {t('gameEnd.viewHistory')}
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
