import { useTranslation } from 'react-i18next'
import { COLUMNS, LOWER_ROWS, UPPER_ROWS, type Cell, type ColumnKey, type FillableRowKey, type PlayerTable } from '../lib/types'
import { upperColumnStatus } from '../lib/scoring'
import type { CellSuggestion } from '../lib/learningMode'
import { cellDisplayText, COLUMN_LABELS, ROW_LABELS } from '../lib/format'
import { useLongPress } from '../lib/useLongPress'
import './ScoreTable.css'

interface ScoreTableProps {
  table: PlayerTable
  interactive?: boolean
  onCellTap?: (column: ColumnKey, row: FillableRowKey) => void
  onCellLongPress?: (column: ColumnKey, row: FillableRowKey) => void
  mirrorLabel?: boolean
  /** Learning-mode hints for the active player — which empty cells the current roll would fill,
   * which are one reroll away ('near', only while a reroll is still available), or (when nothing
   * fits) one to cross out. See src/lib/learningMode.ts. */
  suggestions?: CellSuggestion[]
}

const DISPLAY_ROWS: FillableRowKey[] = [...UPPER_ROWS]

interface DataCellProps {
  column: ColumnKey
  row: FillableRowKey
  cell: Cell
  interactive: boolean
  isY: boolean
  suggestion?: 'fill' | 'cross' | 'near'
  onTap?: (column: ColumnKey, row: FillableRowKey) => void
  onLongPress?: (column: ColumnKey, row: FillableRowKey) => void
}

function DataCell({ column, row, cell, interactive, isY, suggestion, onTap, onLongPress }: DataCellProps) {
  const longPress = useLongPress({
    onTap: () => onTap?.(column, row),
    onLongPress: () => onLongPress?.(column, row),
  })
  const showCross = cell.kind === 'empty' && suggestion === 'cross'
  const classes = [
    'st-cell',
    'st-val',
    isY ? 'st-bold-row' : '',
    cell.kind === 'crossed' ? 'st-crossed' : '',
    interactive ? 'st-tappable' : '',
    cell.kind === 'empty' && suggestion === 'fill' ? 'st-suggest-fill' : '',
    cell.kind === 'empty' && suggestion === 'near' ? 'st-suggest-near' : '',
    showCross ? 'st-suggest-cross' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={classes} disabled={!interactive} {...longPress}>
      {cellDisplayText(cell, row, column)}
      {showCross && (
        <svg className="st-suggest-cross-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line x1="6" y1="94" x2="94" y2="6" />
        </svg>
      )}
    </button>
  )
}

export default function ScoreTable({
  table,
  interactive = false,
  onCellTap,
  onCellLongPress,
  mirrorLabel = true,
  suggestions = [],
}: ScoreTableProps) {
  const { t } = useTranslation()
  function suggestionFor(column: ColumnKey, row: FillableRowKey) {
    return suggestions.find((s) => s.column === column && s.row === row)?.kind
  }
  function renderLabelCell(text: string, key: string, extraClass = '') {
    return (
      <div className={`st-cell st-label ${extraClass}`} key={key}>
        {text}
      </div>
    )
  }

  function renderDataCell(column: ColumnKey, row: FillableRowKey) {
    return (
      <DataCell
        key={`${column}-${row}`}
        column={column}
        row={row}
        cell={table[column][row]}
        interactive={interactive}
        isY={row === 'Y'}
        suggestion={suggestionFor(column, row)}
        onTap={onCellTap}
        onLongPress={onCellLongPress}
      />
    )
  }

  function renderTotCell(column: ColumnKey, key: string) {
    const status = upperColumnStatus(table, column)
    let text = ''
    let cls = 'st-cell st-val st-bold-row st-tot'
    if (!status.complete) {
      if (status.bank > 0) {
        text = `+${status.bank}`
        cls += ' st-bank-pos'
      } else if (status.bank < 0) {
        text = `${status.bank}`
        cls += ' st-bank-neg'
      }
    } else {
      text = String(status.total)
    }
    return (
      <div className={cls} key={key}>
        {text}
      </div>
    )
  }

  return (
    <div className="score-table">
      <div className="st-grid">
        <div className="st-cell st-head" />
        {COLUMNS.map((c) => (
          <div className="st-cell st-head" key={`h-${c}`}>
            {COLUMN_LABELS[c]}
          </div>
        ))}
        {mirrorLabel && <div className="st-cell st-head" />}

        {DISPLAY_ROWS.map((row) => (
          <div className="st-row" key={row} style={{ display: 'contents' }}>
            {renderLabelCell(ROW_LABELS[row], `l-${row}`)}
            {COLUMNS.map((c) => renderDataCell(c, row))}
            {mirrorLabel && renderLabelCell(ROW_LABELS[row], `lr-${row}`)}
          </div>
        ))}

        <div style={{ display: 'contents' }}>
          {renderLabelCell(t('common.total'), 'l-tot', 'st-bold-row')}
          {COLUMNS.map((c) => renderTotCell(c, `tot-${c}`))}
          {mirrorLabel && renderLabelCell(t('common.total'), 'lr-tot', 'st-bold-row')}
        </div>

        {LOWER_ROWS.map((row) => (
          <div className="st-row" key={row} style={{ display: 'contents' }}>
            {renderLabelCell(ROW_LABELS[row], `l-${row}`, row === 'Y' ? 'st-bold-row' : '')}
            {COLUMNS.map((c) => renderDataCell(c, row))}
            {mirrorLabel && renderLabelCell(ROW_LABELS[row], `lr-${row}`, row === 'Y' ? 'st-bold-row' : '')}
          </div>
        ))}

        <div style={{ display: 'contents' }}>
          <div className="st-cell st-footer" />
          {COLUMNS.map((c) => (
            <div className="st-cell st-footer" key={`f-${c}`}>
              {c === 'U' ? '↑' : ''}
            </div>
          ))}
          {mirrorLabel && <div className="st-cell st-footer" />}
        </div>
      </div>
    </div>
  )
}
