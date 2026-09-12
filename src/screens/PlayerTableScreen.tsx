import { useState } from 'react'
import ScoreTable from '../components/ScoreTable'
import DiceTray from '../components/DiceTray'
import CellDialog from '../components/dialogs/CellDialog'
import { useGame } from '../state/GameContext'
import { emptyCell, isRowUnlocked, playerGrandTotal } from '../lib/scoring'
import { useToast } from '../lib/useToast'
import type { Cell, ColumnKey, FillableRowKey } from '../lib/types'
import './PlayerTableScreen.css'

interface PlayerTableScreenProps {
  playerId?: string
}

export default function PlayerTableScreen({ playerId }: PlayerTableScreenProps) {
  const { players, activePlayerIndex, gameType, dice, turnFilledCell, showLiveTotal, dispatch } = useGame()
  const [open, setOpen] = useState<{ column: ColumnKey; row: FillableRowKey } | null>(null)
  const { toast, showToast } = useToast()

  const activePlayer = players[activePlayerIndex]
  const player = (playerId && players.find((p) => p.id === playerId)) || activePlayer
  const isActive = !!player && player.id === activePlayer?.id

  if (!player) return null

  function handleCellTap(column: ColumnKey, row: FillableRowKey) {
    if (!isActive) return
    const cell = player.table[column][row]
    if (cell.kind === 'empty') {
      if (!isRowUnlocked(player.table, column, row)) {
        showToast('Nu ai ajuns aici pe această coloană')
        return
      }
      if (turnFilledCell) {
        showToast('Poți completa o singură căsuță pe rundă')
        return
      }
    }
    setOpen({ column, row })
  }

  function commit(cell: Cell) {
    if (!open) return
    dispatch({ type: 'SET_CELL', playerIndex: activePlayerIndex, column: open.column, row: open.row, cell })
    setOpen(null)
  }

  function handleNextPlayer() {
    if (!turnFilledCell) {
      showToast('Completează sau taie o căsuță înainte să treci mai departe')
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
          Tabel general
        </button>
        <div className="pts-topbar-info">
          <div className="pts-player-name">{player.name}</div>
          <div className="pts-round-tag">
            Jucător {players.findIndex((p) => p.id === player.id) + 1} din {players.length}
          </div>
          {!isActive && <div className="pts-view-only">Doar vizualizare</div>}
        </div>
      </div>

      {gameType === 'virtual' && isActive && (
        <DiceTray
          dice={dice}
          onRoll={() => dispatch({ type: 'ROLL_DICE' })}
          onToggleHold={(i) => dispatch({ type: 'TOGGLE_HOLD', index: i })}
        />
      )}

      <div className="pts-table-wrap">
        <ScoreTable table={player.table} interactive={isActive} onCellTap={handleCellTap} />
      </div>

      {showLiveTotal && (
        <div className="pts-total-card">
          <div className="pts-total-name">{player.name}</div>
          <div className="pts-total-score">{playerGrandTotal(player.table)} p</div>
        </div>
      )}

      <div className="pts-bottom-row">
        <button
          className="pts-link-btn"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'rules', from: { name: 'player' } } })}
        >
          Vezi regulile
        </button>
        {isActive && (
          <button className="pts-next-btn" onClick={handleNextPlayer}>
            Următorul jucător
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
          onConfirm={(cell) => commit(cell)}
          onCross={() => commit({ kind: 'crossed' })}
          onClear={() => commit(emptyCell())}
          onCancel={() => setOpen(null)}
        />
      )}

      {toast && <div className="pts-toast">{toast}</div>}
    </div>
  )
}
