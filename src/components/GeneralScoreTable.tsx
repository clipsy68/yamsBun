import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { COLUMNS, LOWER_ROWS, UPPER_ROWS, type ColumnKey, type FillableRowKey, type PlayerTable } from '../lib/types'
import { upperColumnStatus } from '../lib/scoring'
import type { CellSuggestion } from '../lib/learningMode'
import { cellDisplayText, COLUMN_LABELS } from '../lib/format'
import { useLongPress } from '../lib/useLongPress'
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
  onCellLongPress?: (playerId: string, column: ColumnKey, row: FillableRowKey) => void
  /** Learning-mode hints, scoped to a single player (see src/lib/learningMode.ts). */
  suggestions?: CellSuggestion[]
  suggestionsPlayerId?: string
}

interface GridCell {
  text: string
  className: string
  span?: number
  onClick?: () => void
  onLongPress?: () => void
  playerId?: string
  showCross?: boolean
}

function CrossSuggestSvg() {
  return (
    <svg className="gst-suggest-cross-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line x1="6" y1="94" x2="94" y2="6" />
    </svg>
  )
}

function GstButton({ cell, style }: { cell: GridCell; style?: CSSProperties }) {
  const longPress = useLongPress({ onTap: cell.onClick, onLongPress: cell.onLongPress })
  return (
    <button type="button" className={`gst-cell ${cell.className}`} style={style} data-player-id={cell.playerId} {...longPress}>
      {cell.text}
      {cell.showCross && <CrossSuggestSvg />}
    </button>
  )
}

// Internal sentinel for the computed "Tot" row — never shown directly, see labelCell() below for
// the translated display text.
const TOT_ROW = 'Tot'
const ROW_LABEL_LIST = [...UPPER_ROWS, TOT_ROW, ...LOWER_ROWS] as const

export default function GeneralScoreTable({
  players,
  highlightStyle = 'turn',
  highlightedId,
  onSelectPlayer,
  interactivePlayerId,
  onCellTap,
  onCellLongPress,
  suggestions = [],
  suggestionsPlayerId,
}: GeneralScoreTableProps) {
  const { t } = useTranslation()
  function suggestionFor(column: ColumnKey, row: FillableRowKey) {
    return suggestions.find((s) => s.column === column && s.row === row)?.kind
  }
  // minmax floor keeps cells legible once there isn't room for everyone at --gst-cell-max — below
  // that point the grid overflows its max-width (see .gst-grid) instead of shrinking cells toward
  // unreadable, so an ancestor with overflow-x can scroll it (GameEndScreen/HistoryDetailScreen's
  // .ge-table-wrap, GeneralTableScreen's .gts-table-wrap).
  const gridTemplateColumns = [
    '34px',
    ...players.flatMap(() => ['repeat(5, minmax(28px, var(--gst-cell-max, 44px)))', '34px']),
  ].join(' ')

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
    const isTot = label === TOT_ROW
    const isY = label === 'Y'
    const rowClass = `${isTot ? 'gst-tot gst-bold-row' : ''} ${isY ? 'gst-bold-row' : ''}`.trim()
    const labelCell = (): GridCell => ({ text: isTot ? t('common.total') : label, className: `gst-label ${rowClass}`.trim() })
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
        const showSuggestions = p.id === suggestionsPlayerId
        for (const col of COLUMNS) {
          const cell = p.table[col][row]
          const crossed = cell.kind === 'crossed'
          const suggestion = cell.kind === 'empty' && showSuggestions ? suggestionFor(col, row) : undefined
          const showCross = suggestion === 'cross'
          cells.push({
            text: crossed ? '' : cellDisplayText(cell, row, col),
            className: `gst-val ${rowClass} ${crossed ? 'gst-crossed' : ''} ${tappableRow ? 'gst-tappable' : ''} ${
              suggestion === 'fill' ? 'gst-suggest-fill' : showCross ? 'gst-suggest-cross' : ''
            }`.trim(),
            onClick: tappableRow ? () => onCellTap!(p.id, col, row) : undefined,
            onLongPress: tappableRow && onCellLongPress ? () => onCellLongPress(p.id, col, row) : undefined,
            showCross,
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
                return <GstButton key={ci} cell={cell} style={style} />
              }
              return (
                <div key={ci} className={`gst-cell ${cell.className}`} style={style} data-player-id={cell.playerId}>
                  {cell.text}
                  {cell.showCross && <CrossSuggestSvg />}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
