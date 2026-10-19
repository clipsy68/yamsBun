import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ScoreTable from '../components/ScoreTable'
import DiceTray from '../components/DiceTray'
import CellDialog from '../components/dialogs/CellDialog'
import ConfirmDialog from '../components/dialogs/ConfirmDialog'
import { useGame } from '../state/GameContext'
import { emptyCell, isRowUnlocked, playerGrandTotal, siblingChanceSum } from '../lib/scoring'
import { suggestedCells } from '../lib/learningMode'
import { useSuggestionsReady } from '../lib/useSuggestionsReady'
import { useToast } from '../lib/useToast'
import type { Cell, ColumnKey, FillableRowKey } from '../lib/types'
import './PlayerTableScreen.css'

interface PlayerTableScreenProps {
  playerId?: string
}

export default function PlayerTableScreen({ playerId }: PlayerTableScreenProps) {
  const { t } = useTranslation()
  const { players, activePlayerIndex, gameType, dice, turnFilledCell, showLiveTotal, learningMode, dispatch } = useGame()
  const [open, setOpen] = useState<{ column: ColumnKey; row: FillableRowKey } | null>(null)
  const [confirmingQuit, setConfirmingQuit] = useState(false)
  const { toast, showToast } = useToast()
  const suggestionsReady = useSuggestionsReady(dice.rollsUsed)

  const activePlayer = players[activePlayerIndex]
  const player = (playerId && players.find((p) => p.id === playerId)) || activePlayer
  const isActive = !!player && player.id === activePlayer?.id

  if (!player) return null

  const suggestions =
    learningMode && gameType === 'virtual' && isActive && dice.rollsUsed > 0 && suggestionsReady
      ? suggestedCells(dice, player.table)
      : []

  function handleCellTap(column: ColumnKey, row: FillableRowKey) {
    if (!isActive) return
    const cell = player.table[column][row]
    if (cell.kind === 'empty') {
      if (!isRowUnlocked(player.table, column, row)) {
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

  function handleCellLongPress(column: ColumnKey, row: FillableRowKey) {
    if (!isActive) return
    const cell = player.table[column][row]
    if (cell.kind !== 'empty') return
    if (!isRowUnlocked(player.table, column, row)) {
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

  function handleNextPlayer() {
    if (!turnFilledCell) {
      showToast(t('playerTable.toastFillOrCross'))
      return
    }
    dispatch({ type: 'NEXT_PLAYER' })
  }

  return (
    <div className="pts-screen">
      <div className="pts-topbar">
        <button className="pts-back-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'general' } })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('playerTable.backToGeneral')}
        </button>
        <div className="pts-topbar-right">
          <div className="pts-topbar-info pts-slide-in" key={`info-${player.id}`}>
            <div className="pts-player-name">{player.name}</div>
            <div className="pts-round-tag">
              {t('playerTable.playerOf', { n: players.findIndex((p) => p.id === player.id) + 1, total: players.length })}
            </div>
            {!isActive && <div className="pts-view-only">{t('playerTable.viewOnly')}</div>}
          </div>
          <button className="pts-quit-btn" onClick={() => setConfirmingQuit(true)}>
            {t('playerTable.quit')}
          </button>
        </div>
      </div>

      <div className="pts-content pts-slide-in" key={`content-${player.id}`}>
        {gameType === 'virtual' && isActive && (
          <DiceTray
            dice={dice}
            onRoll={() => dispatch({ type: 'ROLL_DICE' })}
            onToggleHold={(i) => dispatch({ type: 'TOGGLE_HOLD', index: i })}
            locked={!!turnFilledCell}
          />
        )}

        <div className="pts-table-wrap">
          <ScoreTable
            table={player.table}
            interactive={isActive}
            onCellTap={handleCellTap}
            onCellLongPress={handleCellLongPress}
            suggestions={suggestions}
          />
        </div>

        {showLiveTotal && (
          <div className="pts-total-card">
            <div className="pts-total-name">{player.name}</div>
            <div className="pts-total-score">{t('common.scoreSuffix', { score: playerGrandTotal(player.table) })}</div>
          </div>
        )}
      </div>

      <div className="pts-bottom-row">
        <button
          className="pts-link-btn"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'rules', from: { name: 'player' } } })}
        >
          {t('playerTable.viewRules')}
        </button>
        {isActive && (
          <button className="pts-next-btn" onClick={handleNextPlayer}>
            {t('playerTable.nextPlayer')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {open && isActive && (
        <CellDialog
          column={open.column}
          row={open.row}
          existingCell={player.table[open.column][open.row]}
          dice={gameType === 'virtual' ? dice : undefined}
          siblingChanceSum={siblingChanceSum(player.table, open.column, open.row)}
          onConfirm={(cell) => commit(cell)}
          onCross={() => commit({ kind: 'crossed' })}
          onClear={() => commit(emptyCell())}
          onCancel={() => setOpen(null)}
        />
      )}

      {toast && <div className="pts-toast">{toast}</div>}

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
