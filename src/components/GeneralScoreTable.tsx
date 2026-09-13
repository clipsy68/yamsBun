import { COLUMNS, LOWER_ROWS, UPPER_ROWS, type ColumnKey, type FillableRowKey, type PlayerTable } from '../lib/types'
import { upperColumnStatus } from '../lib/scoring'
import { cellDisplayText, COLUMN_LABELS } from '../lib/format'
import './GeneralScoreTable.css'

export interface GeneralScoreTablePlayer {
  id: string
  name: string
  table: PlayerTable
}

interface GeneralScoreTableProps {
  players: GeneralScoreTablePlayer[]
  /** 'turn' = subtle orange name text (whose turn it is, during play). 'select' = orange ring + checkmark, tappable. */
  highlightStyle?: 'turn' | 'select'
  highlightedId?: string
  onSelectPlayer?: (id: string) => void
  /** When set, this player's empty/crossed data cells become tappable. */
  interactivePlayerId?: string
  onCellTap?: (playerId: string, column: ColumnKey, row: FillableRowKey) => void
}

interface GridCell {
  text: string
  className: string
  span?: number
  onClick?: () => void
  playerId?: string
}

const ROW_LABEL_LIST = [...UPPER_ROWS, 'Tot', ...LOWER_ROWS] as const

export default function GeneralScoreTable({
  players,
  highlightStyle = 'turn',
  highlightedId,
  onSelectPlayer,
  interactivePlayerId,
  onCellTap,
}: GeneralScoreTableProps) {
  const gridTemplateColumns = ['34px', ...players.flatMap(() => ['repeat(5, minmax(0, 44px))', '34px'])].join(' ')

  function isHighlighted(id: string) {
    return highlightedId === id
  }

  const nameRow: GridCell[] = []
  const subRow: GridCell[] = []
  nameRow.push({ text: '', className: 'gst-corner' })
  subRow.push({ text: '', className: 'gst-corner' })
  for (const p of players) {
    const highlighted = isHighlighted(p.id)
    const selectMode = highlightStyle === 'select' && highlighted
    const turnMode = highlightStyle === 'turn' && highlighted
    nameRow.push({
      text: (selectMode ? '✓ ' : '') + p.name,
      className: `gst-name ${turnMode ? 'gst-name-turn' : ''} ${selectMode ? 'gst-name-select' : ''}`,
      span: 5,
      onClick: onSelectPlayer ? () => onSelectPlayer(p.id) : undefined,
      playerId: p.id,
    })
    nameRow.push({ text: '', className: 'gst-corner' })
    for (const h of COLUMNS) {
      subRow.push({
        text: COLUMN_LABELS[h],
        className: `gst-subhead ${selectMode ? 'gst-subhead-select' : ''}`,
        onClick: onSelectPlayer ? () => onSelectPlayer(p.id) : undefined,
      })
    }
    subRow.push({ text: '', className: 'gst-corner' })
  }

  const dataRows: GridCell[][] = ROW_LABEL_LIST.map((label) => {
    const isTot = label === 'Tot'
    const isY = label === 'Y'
    const rowClass = `${isTot ? 'gst-tot gst-bold-row' : ''} ${isY ? 'gst-bold-row' : ''}`.trim()
    const labelCell = (): GridCell => ({ text: label, className: `gst-label ${rowClass}`.trim() })
    const cells: GridCell[] = [labelCell()]
    for (const p of players) {
      if (isTot) {
        for (const col of COLUMNS) {
          const status = upperColumnStatus(p.table, col)
          let text = ''
          let bankClass = ''
          if (!status.complete) {
            if (status.bank > 0) {
              text = `+${status.bank}`
              bankClass = 'gst-bank-pos'
            } else if (status.bank < 0) {
              text = `${status.bank}`
              bankClass = 'gst-bank-neg'
            }
          } else {
            text = String(status.total)
          }
          cells.push({ text, className: `gst-val ${rowClass} ${bankClass}`.trim() })
        }
      } else {
        const row = label as (typeof UPPER_ROWS)[number] | (typeof LOWER_ROWS)[number]
        const tappableRow = p.id === interactivePlayerId && !!onCellTap
        for (const col of COLUMNS) {
          const cell = p.table[col][row]
          const crossed = cell.kind === 'crossed'
          cells.push({
            text: crossed ? '' : cellDisplayText(cell, row, col),
            className: `gst-val ${rowClass} ${crossed ? 'gst-crossed' : ''} ${tappableRow ? 'gst-tappable' : ''}`.trim(),
            onClick: tappableRow ? () => onCellTap!(p.id, col, row) : undefined,
          })
        }
      }
      cells.push(labelCell())
    }
    return cells
  })

  const footerRow: GridCell[] = [{ text: '', className: 'gst-footer' }]
  for (let i = 0; i < players.length; i++) {
    for (const col of COLUMNS) {
      footerRow.push({ text: col === 'U' ? '↑' : '', className: 'gst-footer' })
    }
    footerRow.push({ text: '', className: 'gst-footer' })
  }

  const allRows: GridCell[][] = [nameRow, subRow, ...dataRows, footerRow]

  return (
    <div className="gst-wrap">
      <div className="gst-grid" style={{ gridTemplateColumns }}>
        {allRows.map((row, ri) => (
          <div key={ri} style={{ display: 'contents' }}>
            {row.map((cell, ci) => {
              const style = cell.span ? { gridColumn: `span ${cell.span}` } : undefined
              if (cell.onClick) {
                return (
                  <button
                    key={ci}
                    type="button"
                    className={`gst-cell ${cell.className}`}
                    style={style}
                    onClick={cell.onClick}
                    data-player-id={cell.playerId}
                  >
                    {cell.text}
                  </button>
                )
              }
              return (
                <div key={ci} className={`gst-cell ${cell.className}`} style={style} data-player-id={cell.playerId}>
                  {cell.text}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
