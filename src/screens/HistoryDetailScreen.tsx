import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import GeneralScoreTable from '../components/GeneralScoreTable'
import { getHistoryEntry } from '../lib/storage'
import { formatDuration } from '../lib/format'
import { useGame } from '../state/GameContext'
import './GameEndScreen.css'

interface HistoryDetailScreenProps {
  id: string
}

export default function HistoryDetailScreen({ id }: HistoryDetailScreenProps) {
  const { t, i18n } = useTranslation()
  const { dispatch } = useGame()
  const entry = useMemo(() => getHistoryEntry(id), [id])

  if (!entry) {
    return (
      <div className="ge-screen">
        <div className="ge-content">
          <div>{t('historyDetail.notFound')}</div>
          <button className="ge-btn-history" onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'history' } })}>
            {t('historyDetail.backToHistory')}
          </button>
        </div>
      </div>
    )
  }

  const locale = i18n.resolvedLanguage ?? 'en'
  const players = entry.tables.map((pt, i) => ({ id: `${i}-${pt.name}`, name: pt.name, table: pt.table }))
  const startTime = new Date(entry.startedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const endTime = new Date(entry.finishedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const duration = formatDuration(new Date(entry.finishedAt).getTime() - new Date(entry.startedAt).getTime())

  return (
    <div className="ge-screen">
      <div className="ge-topbar">
        <button
          className="ge-trophy"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'history' } })}
          aria-label={t('historyDetail.backAria')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <div className="ge-t1">{new Date(entry.finishedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div className="ge-t2">
            {entry.players.map((p) => p.name).join(', ')} · {startTime}–{endTime} ({duration})
          </div>
        </div>
      </div>

      <div className="ge-content">
        <div className="ge-page">
          <div className="ge-table-wrap">
            <GeneralScoreTable players={players} />
          </div>

          <div className="ge-totals-row">
            {entry.players.map((p) => (
              <div className={`ge-totals-card ${entry.winnerNames.includes(p.name) ? 'winner' : ''}`} key={p.name}>
                <div className="ge-totals-name-row">
                  <div className="ge-totals-name">{p.name}</div>
                </div>
                <div className="ge-totals-score">{t('common.scoreSuffix', { score: p.total })}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
