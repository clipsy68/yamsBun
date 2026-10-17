import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { deleteHistoryEntry, listHistory, type HistoryEntry } from '../lib/storage'
import { formatDuration } from '../lib/format'
import { useGame } from '../state/GameContext'
import './HistoryScreen.css'

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTimeRange(entry: HistoryEntry, locale: string): string {
  const start = new Date(entry.startedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const end = new Date(entry.finishedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const duration = formatDuration(new Date(entry.finishedAt).getTime() - new Date(entry.startedAt).getTime())
  return `${start}–${end} (${duration})`
}

export default function HistoryScreen() {
  const { t, i18n } = useTranslation()
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
        <div className="hs-title">{t('history.title')}</div>
      </div>

      {entries.length === 0 && <div className="hs-empty">{t('history.empty')}</div>}

      <div className="hs-list">
        {entries.map((e) => (
          <div className="hs-entry" key={e.id}>
            <button
              type="button"
              className="hs-entry-main"
              onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'historyDetail', id: e.id } })}
            >
              <div className="hs-date">{formatDate(e.finishedAt, i18n.resolvedLanguage ?? 'en')}</div>
              <div className="hs-time-range">{formatTimeRange(e, i18n.resolvedLanguage ?? 'en')}</div>
              <div className="hs-players">{e.players.map((p) => p.name).join(', ')}</div>
              <div className="hs-winner">
                <TrophyIcon />
                <div className="hs-who">{e.winnerNames.join(', ')}</div>
                <div className="hs-score">{t('common.scoreSuffix', { score: e.winnerScore })}</div>
              </div>
            </button>
            <button
              type="button"
              className="hs-delete-btn"
              onClick={() => handleDelete(e.id)}
              aria-label={t('history.deleteAria')}
            >
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
