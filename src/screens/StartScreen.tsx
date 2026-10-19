import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/GameContext'
import { searchSavedPlayers, type SavedPlayer } from '../lib/players'
import LanguageDialog from '../components/dialogs/LanguageDialog'
import './StartScreen.css'

const PLAYER_COUNTS = [2, 3, 4, 5, 6]

export default function StartScreen() {
  const { t } = useTranslation()
  const { dispatch } = useGame()
  const [playerCount, setPlayerCount] = useState(2)
  const [gameType, setGameType] = useState<'fizic' | 'virtual'>('fizic')
  const [names, setNames] = useState<string[]>(['', ''])
  const [showLiveTotal, setShowLiveTotal] = useState(false)
  const [learningMode, setLearningMode] = useState(false)
  const [suggestIndex, setSuggestIndex] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<SavedPlayer[]>([])
  const [showLanguagePicker, setShowLanguagePicker] = useState(false)

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
    if (value.trim().length >= 2) {
      const usedElsewhere = new Set(
        names.filter((_, i) => i !== index).map((n) => n.trim().toLowerCase()),
      )
      const matches = searchSavedPlayers(value).filter((p) => !usedElsewhere.has(p.name.toLowerCase()))
      setSuggestions(matches)
      setSuggestIndex(matches.length > 0 ? index : null)
    } else {
      setSuggestIndex(null)
    }
  }

  function selectSuggestion(index: number, name: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? name : n)))
    setSuggestIndex(null)
  }

  // Two players sharing a name isn't just confusing at the table — history and the leaderboard
  // both key a finished game's winner(s) by name string (not player identity, which isn't kept
  // in persisted history), so a duplicate name would show BOTH players marked as winner on a tie
  // that was really only one of them, and silently merge their saved stats into one entry.
  const normalizedNames = names.map((n) => n.trim().toLowerCase())
  const duplicateIndices = new Set<number>()
  normalizedNames.forEach((n, i) => {
    if (!n) return
    const firstIdx = normalizedNames.indexOf(n)
    if (firstIdx !== i) {
      duplicateIndices.add(i)
      duplicateIndices.add(firstIdx)
    }
  })
  const hasDuplicateNames = duplicateIndices.size > 0

  const canStart = names.every((n) => n.trim().length > 0) && !hasDuplicateNames

  return (
    <div className="start-screen">
      <div className="topbar">
        <img className="brand-icon" src={`${import.meta.env.BASE_URL}icon.png`} alt="Yams Bun" />
        <div className="topbar-actions">
          <button
            type="button"
            className="info-btn"
            onClick={() => setShowLanguagePicker(true)}
            aria-label={t('start.languageAria')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <button
            className="info-btn"
            onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'leaderboard' } })}
            aria-label={t('start.leaderboardAria')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 4h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M9 20h6M12 13v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="info-btn"
            onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'history' } })}
            aria-label={t('start.historyAria')}
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
            aria-label={t('start.rulesAria')}
          >
            i
          </button>
        </div>
      </div>

      <section>
        <div className="label">{t('start.playerCountLabel')}</div>
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
        <div className="label">{t('start.gameTypeLabel')}</div>
        <div className="type-row">
          <button
            className={`type-card ${gameType === 'fizic' ? 'selected' : 'idle'}`}
            onClick={() => {
              setGameType('fizic')
              // Learning mode reads the live dice to suggest cells — meaningless without zaruri
              // virtuale, so switching away silently drops a stale "on" state rather than leaving
              // a checked toggle that would do nothing once the game starts.
              setLearningMode(false)
            }}
          >
            <div className="type-title">{t('start.physicalDiceTitle')}</div>
            <div className="type-sub">{t('start.physicalDiceSub')}</div>
          </button>
          <button
            className={`type-card ${gameType === 'virtual' ? 'selected' : 'idle'}`}
            onClick={() => setGameType('virtual')}
          >
            <div className="type-title">{t('start.virtualDiceTitle')}</div>
            <div className="type-sub">{t('start.virtualDiceSub')}</div>
          </button>
        </div>
      </section>

      <section>
        <div className="label">{t('start.playerNamesLabel')}</div>
        <div className="hint">{t('start.playerNamesHint')}</div>
        <div className="name-list">
          {names.map((name, i) => (
            <div className="name-row" key={i}>
              <div className="name-badge">{i + 1}</div>
              <input
                className={`name-input ${duplicateIndices.has(i) ? 'name-input-duplicate' : ''}`}
                placeholder={t('start.playerNamePlaceholder', { n: i + 1 })}
                value={name}
                onChange={(e) => handleNameChange(i, e.target.value)}
                onFocus={() => handleNameChange(i, name)}
                onBlur={() => setTimeout(() => setSuggestIndex((cur) => (cur === i ? null : cur)), 150)}
                maxLength={24}
              />
              {suggestIndex === i && suggestions.length > 0 && (
                <div className="name-suggestions">
                  {suggestions.map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      className="name-suggestion"
                      onClick={() => selectSuggestion(i, p.name)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {hasDuplicateNames && <div className="name-duplicate-warning">{t('start.duplicateNamesWarning')}</div>}
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
            <div className="toggle-title">{t('start.liveTotalTitle')}</div>
            <div className="toggle-sub">{t('start.liveTotalSub')}</div>
          </div>
        </label>
        <label className={`toggle-row ${gameType === 'fizic' ? 'toggle-row-disabled' : ''}`}>
          <button
            type="button"
            className={`checkbox ${learningMode ? 'checked' : ''}`}
            onClick={() => gameType === 'virtual' && setLearningMode((v) => !v)}
            disabled={gameType === 'fizic'}
            aria-pressed={learningMode}
          />
          <div className="toggle-text">
            <div className="toggle-title">{t('start.learningModeTitle')}</div>
            <div className="toggle-sub">
              {gameType === 'fizic' ? t('start.learningModeSubDisabled') : t('start.learningModeSub')}
            </div>
          </div>
        </label>
      </section>

      <div className="spacer" />
      <button
        className="start-btn"
        disabled={!canStart}
        onClick={() => dispatch({ type: 'START_GAME', setup: { playerCount, gameType, names, showLiveTotal, learningMode } })}
      >
        {t('start.startButton')}
      </button>

      {showLanguagePicker && <LanguageDialog onClose={() => setShowLanguagePicker(false)} />}
    </div>
  )
}
