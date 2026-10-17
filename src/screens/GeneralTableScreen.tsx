import { useLayoutEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import GeneralScoreTable from '../components/GeneralScoreTable'
import DiceTray from '../components/DiceTray'
import ConfirmDialog from '../components/dialogs/ConfirmDialog'
import CellDialog from '../components/dialogs/CellDialog'
import { useGame } from '../state/GameContext'
import { emptyCell, isRowUnlocked, playerGrandTotal, siblingChanceSum } from '../lib/scoring'
import { useToast } from '../lib/useToast'
import { useElapsedTime } from '../lib/useElapsedTime'
import type { Cell, ColumnKey, FillableRowKey } from '../lib/types'
import './GeneralTableScreen.css'

// Keep in sync with the `@media (min-width: ...)` breakpoint in GeneralTableScreen.css and
// GeneralScoreTable.css — past it the "next player" button sits in normal flow (CSS handles
// position/centering) instead of floating at a JS-computed x over the active player's column.
const DESKTOP_BREAKPOINT = '(min-width: 820px)'

export default function GeneralTableScreen() {
  const { t } = useTranslation()
  const { players, activePlayerIndex, showLiveTotal, turnFilledCell, startedAt, gameType, dice, dispatch } = useGame()
  const elapsed = useElapsedTime(startedAt)
  const active = players[activePlayerIndex]
  const [confirmingQuit, setConfirmingQuit] = useState(false)
  const [open, setOpen] = useState<{ column: ColumnKey; row: FillableRowKey } | null>(null)
  const { toast, showToast } = useToast()
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const diceTrayRef = useRef<HTMLDivElement>(null)
  const [floatCenterX, setFloatCenterX] = useState<number | null>(null)

  useLayoutEffect(() => {
    const target = diceTrayRef.current || tableWrapRef.current
    if (!target) return
    const y = target.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: y })
  }, [])

  useLayoutEffect(() => {
    if (!turnFilledCell || !active) {
      setFloatCenterX(null)
      return
    }
    function updatePosition() {
      if (!Capacitor.isNativePlatform() && window.matchMedia(DESKTOP_BREAKPOINT).matches) {
        setFloatCenterX(null)
        return
      }
      const wrap = tableWrapRef.current
      const nameCell = wrap?.querySelector(`[data-player-id="${active!.id}"].gst-name`)
      if (!nameCell) return
      const rect = nameCell.getBoundingClientRect()
      const halfBtn = 100
      const margin = 12
      const clamped = Math.min(
        Math.max(rect.left + rect.width / 2, halfBtn + margin),
        window.innerWidth - halfBtn - margin,
      )
      setFloatCenterX(clamped)
    }
    updatePosition()
    const wrap = tableWrapRef.current
    wrap?.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('resize', updatePosition)
    return () => {
      wrap?.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [turnFilledCell, active])

  function handleCellTap(playerId: string, column: ColumnKey, row: FillableRowKey) {
    if (!active || playerId !== active.id) return
    const cell = active.table[column][row]
    if (cell.kind === 'empty') {
      if (!isRowUnlocked(active.table, column, row)) {
        showToast(t('game.toastLockedColumn'))
        return
      }
      if (turnFilledCell) {
        showToast(t('game.toastOneCellPerTurn'))
        return
      }
    } else if (!turnFilledCell || turnFilledCell.column !== column || turnFilledCell.row !== row) {
      showToast(t('game.toastEditOnlyThisTurn'))
      return
    }
    setOpen({ column, row })
  }

  function handleCellLongPress(playerId: string, column: ColumnKey, row: FillableRowKey) {
    if (!active || playerId !== active.id) return
    const cell = active.table[column][row]
    if (cell.kind !== 'empty') return
    if (!isRowUnlocked(active.table, column, row)) {
      showToast(t('game.toastLockedColumn'))
      return
    }
    if (turnFilledCell) {
      showToast(t('game.toastOneCellPerTurn'))
      return
    }
    dispatch({ type: 'SET_CELL', playerIndex: activePlayerIndex, column, row, cell: { kind: 'crossed' } })
  }

  function commit(cell: Cell) {
    if (!open) return
    dispatch({ type: 'SET_CELL', playerIndex: activePlayerIndex, column: open.column, row: open.row, cell })
    setOpen(null)
  }

  function handleSelectPlayer(id: string) {
    dispatch({ type: 'NAVIGATE', screen: { name: 'player', playerId: id } })
  }

  return (
    <div className="gts-screen">
      <div className="gts-topbar">
        <button className="gts-back-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'player' } })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('generalTable.back')}
        </button>
        <div className="gts-title">{t('generalTable.title')}</div>
        {elapsed && <div className="gts-timer">{elapsed}</div>}
        <button
          className="gts-rules-btn"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'rules', from: { name: 'general' } } })}
        >
          {t('generalTable.rules')}
        </button>
        <button className="gts-quit-btn" onClick={() => setConfirmingQuit(true)}>
          {t('generalTable.quit')}
        </button>
      </div>

      {gameType === 'virtual' && active && (
        <div className="gts-dice-wrap" ref={diceTrayRef}>
          <DiceTray
            dice={dice}
            onRoll={() => dispatch({ type: 'ROLL_DICE' })}
            onToggleHold={(i) => dispatch({ type: 'TOGGLE_HOLD', index: i })}
          />
        </div>
      )}

      <div className="gts-table-wrap" ref={tableWrapRef}>
        <GeneralScoreTable
          players={players}
          highlightStyle="turn"
          highlightedId={active?.id}
          onSelectPlayer={handleSelectPlayer}
          interactivePlayerId={active?.id}
          onCellTap={handleCellTap}
          onCellLongPress={handleCellLongPress}
        />
      </div>

      {showLiveTotal && (
        <div className="gts-totals-row">
          {players.map((p) => (
            <div className={`gts-totals-card ${p.id === active?.id ? 'active' : ''}`} key={p.id}>
              <div className="gts-totals-name">{p.name}</div>
              <div className="gts-totals-score">{t('common.scoreSuffix', { score: playerGrandTotal(p.table) })}</div>
            </div>
          ))}
        </div>
      )}

      {turnFilledCell && (
        <button
          className="gts-next-float"
          style={floatCenterX !== null ? { left: floatCenterX } : undefined}
          onClick={() => dispatch({ type: 'NEXT_PLAYER' })}
        >
          {t('generalTable.nextPlayer')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {open && active && (
        <CellDialog
          column={open.column}
          row={open.row}
          existingCell={active.table[open.column][open.row]}
          dice={gameType === 'virtual' ? dice : undefined}
          siblingChanceSum={siblingChanceSum(active.table, open.column, open.row)}
          onConfirm={(cell) => commit(cell)}
          onCross={() => commit({ kind: 'crossed' })}
          onClear={() => commit(emptyCell())}
          onCancel={() => setOpen(null)}
        />
      )}

      {toast && <div className="gts-toast">{toast}</div>}

      {confirmingQuit && (
        <ConfirmDialog
          title={t('game.quitConfirmTitle')}
          message={t('game.quitConfirmMessage')}
          confirmLabel={t('game.quitConfirmButton')}
          onConfirm={() => dispatch({ type: 'QUIT_GAME' })}
          onCancel={() => setConfirmingQuit(false)}
        />
      )}
    </div>
  )
}
