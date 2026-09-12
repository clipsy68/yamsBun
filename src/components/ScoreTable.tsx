import { COLUMNS, LOWER_ROWS, UPPER_ROWS, type ColumnKey, type FillableRowKey, type PlayerTable } from '../lib/types'
import { upperColumnStatus } from '../lib/scoring'
import { cellDisplayText, COLUMN_LABELS, ROW_LABELS } from '../lib/format'
import './ScoreTable.css'

interface ScoreTableProps {
  table: PlayerTable
  interactive?: boolean
  onCellTap?: (column: ColumnKey, row: FillableRowKey) => void
  mirrorLabel?: boolean
}

const DISPLAY_ROWS: FillableRowKey[] = [...UPPER_ROWS]

export default function ScoreTable({ table, interactive = false, onCellTap, mirrorLabel = true }: ScoreTableProps) {
  function renderLabelCell(text: string, key: string, extraClass = '') {
    return (
      <div className={`st-cell st-label ${extraClass}`} key={key}>
        {text}
      </div>
    )
  }

  function renderDataCell(column: ColumnKey, row: FillableRowKey) {
    const cell = table[column][row]
    const isY = row === 'Y'
    const classes = [
      'st-cell',
      'st-val',
      isY ? 'st-bold-row' : '',
      cell.kind === 'crossed' ? 'st-crossed' : '',
      interactive ? 'st-tappable' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        key={`${column}-${row}`}
        type="button"
        className={classes}
        disabled={!interactive}
        onClick={() => onCellTap?.(column, row)}
      >
        {cellDisplayText(cell, row, column)}
      </button>
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
          {renderLabelCell('Tot', 'l-tot', 'st-bold-row')}
          {COLUMNS.map((c) => renderTotCell(c, `tot-${c}`))}
          {mirrorLabel && renderLabelCell('Tot', 'lr-tot', 'st-bold-row')}
        </div>

        {LOWER_ROWS.map((row) => (
          <div className="st-row" key={row} style={{ display: 'contents' }}>
            {renderLabelCell(ROW_LABELS[row], `l-${row}`, row === 'Y' ? 'st-bold-row' : '')}
            {COLUMNS.map((c) => renderDataCell(c, row))}
            {mirrorLabel && renderLabelCell(ROW_LABELS[row], `lr-${row}`, row === 'Y' ? 'st-bold-row' : '')}
          </div>
        ))}
      </div>
    </div>
  )
}
