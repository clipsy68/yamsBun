import { useEffect, useRef, useState } from 'react'
import ScoreTable from '../components/ScoreTable'
import DiceTray from '../components/DiceTray'
import CellDialog from '../components/dialogs/CellDialog'
import { useGame } from '../state/GameContext'
import { emptyCell, isRowUnlocked } from '../lib/scoring'
import type { Cell, ColumnKey, FillableRowKey } from '../lib/types'
import './PlayerTableScreen.css'

export default function PlayerTableScreen() {
  const { players, activePlayerIndex, gameType, dice, dispatch } = useGame()
  const [open, setOpen] = useState<{ column: ColumnKey; row: FillableRowKey } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const player = players[activePlayerIndex]

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  if (!player) return null

  function showToast(message: string) {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1800)
  }

  function handleCellTap(column: ColumnKey, row: FillableRowKey) {
    const cell = player.table[column][row]
    if (cell.kind === 'empty' && !isRowUnlocked(player.table, column, row)) {
      showToast('Nu ai ajuns aici pe această coloană')
      return
    }
    setOpen({ column, row })
  }

  function commit(cell: Cell) {
    if (!open) return
    dispatch({ type: 'SET_CELL', playerIndex: activePlayerIndex, column: open.column, row: open.row, cell })
    setOpen(null)
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
        <div className="pts-round-tag">
          Jucător {activePlayerIndex + 1} din {players.length}
        </div>
      </div>

      <div className="pts-heading">
        <div className="pts-name-group">
          <div className="pts-name">{player.name}</div>
          <div className="pts-turn">La rândul lui</div>
        </div>
      </div>

      {gameType === 'virtual' && (
        <DiceTray
          dice={dice}
          onRoll={() => dispatch({ type: 'ROLL_DICE' })}
          onToggleHold={(i) => dispatch({ type: 'TOGGLE_HOLD', index: i })}
        />
      )}

      <div className="pts-table-wrap">
        <ScoreTable table={player.table} interactive onCellTap={handleCellTap} />
      </div>

      <div className="pts-bottom-row">
        <button
          className="pts-link-btn"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'rules', from: { name: 'player' } } })}
        >
          Vezi regulile
        </button>
        <button className="pts-next-btn" onClick={() => dispatch({ type: 'NEXT_PLAYER' })}>
          Următorul jucător
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && (
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
