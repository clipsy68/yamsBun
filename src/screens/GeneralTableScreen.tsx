import { useState } from 'react'
import GeneralScoreTable from '../components/GeneralScoreTable'
import ConfirmDialog from '../components/dialogs/ConfirmDialog'
import CellDialog from '../components/dialogs/CellDialog'
import { useGame } from '../state/GameContext'
import { emptyCell, isRowUnlocked, playerGrandTotal } from '../lib/scoring'
import { useToast } from '../lib/useToast'
import { useElapsedTime } from '../lib/useElapsedTime'
import type { Cell, ColumnKey, FillableRowKey } from '../lib/types'
import './GeneralTableScreen.css'

export default function GeneralTableScreen() {
  const { players, activePlayerIndex, showLiveTotal, turnFilledCell, startedAt, dispatch } = useGame()
  const elapsed = useElapsedTime(startedAt)
  const active = players[activePlayerIndex]
  const [confirmingQuit, setConfirmingQuit] = useState(false)
  const [open, setOpen] = useState<{ column: ColumnKey; row: FillableRowKey } | null>(null)
  const { toast, showToast } = useToast()

  function handleCellTap(playerId: string, column: ColumnKey, row: FillableRowKey) {
    if (!active || playerId !== active.id) return
    const cell = active.table[column][row]
    if (cell.kind === 'empty') {
      if (!isRowUnlocked(active.table, column, row)) {
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

  function handleSelectPlayer(id: string) {
    dispatch({ type: 'NAVIGATE', screen: { name: 'player', playerId: id } })
  }

  function handleNextPlayer() {
    if (!turnFilledCell) {
      showToast('Completează sau taie o căsuță înainte să treci mai departe')
      return
    }
    dispatch({ type: 'NEXT_PLAYER' })
  }

  return (
    <div className="gts-screen">
      <div className="gts-topbar">
        <button className="gts-back-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'player' } })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Înapoi
        </button>
        <div className="gts-title">Tabel general</div>
        {elapsed && <div className="gts-timer">{elapsed}</div>}
        <button className="gts-quit-btn" onClick={() => setConfirmingQuit(true)}>
          Renunță la joc
        </button>
      </div>

      <div className="gts-table-wrap">
        <GeneralScoreTable
          players={players}
          highlightStyle="turn"
          highlightedId={active?.id}
          onSelectPlayer={handleSelectPlayer}
          interactivePlayerId={active?.id}
          onCellTap={handleCellTap}
        />
      </div>

      {showLiveTotal && (
        <div className="gts-totals-row">
          {players.map((p) => (
            <div className={`gts-totals-card ${p.id === active?.id ? 'active' : ''}`} key={p.id}>
              <div className="gts-totals-name">{p.name}</div>
              <div className="gts-totals-score">{playerGrandTotal(p.table)} p</div>
            </div>
          ))}
        </div>
      )}

      <div className="gts-bottom-row">
        <button className="gts-next-btn" onClick={handleNextPlayer}>
          Următorul jucător
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && active && (
        <CellDialog
          column={open.column}
          row={open.row}
          existingCell={active.table[open.column][open.row]}
          onConfirm={(cell) => commit(cell)}
          onCross={() => commit({ kind: 'crossed' })}
          onClear={() => commit(emptyCell())}
          onCancel={() => setOpen(null)}
        />
      )}

      {toast && <div className="gts-toast">{toast}</div>}

      {confirmingQuit && (
        <ConfirmDialog
          title="Renunți la joc?"
          message="Tot progresul din runda curentă se pierde și nu se salvează nimic în istoric."
          confirmLabel="Renunță la joc"
          onConfirm={() => dispatch({ type: 'QUIT_GAME' })}
          onCancel={() => setConfirmingQuit(false)}
        />
      )}
    </div>
  )
}
