import { cellPoints } from './scoring'
import type { Cell, ColumnKey, FillableRowKey } from './types'

export function cellDisplayText(cell: Cell, row: FillableRowKey, column: ColumnKey): string {
  if (cell.kind === 'empty' || cell.kind === 'crossed') return ''
  return String(cellPoints(cell, row, column))
}

export const ROW_LABELS: Record<FillableRowKey, string> = {
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  q: 'q',
  Q: 'Q',
  F: 'F',
  K: 'K',
  Y: 'Y',
  m: 'm',
  M: 'M',
}

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  L: 'L',
  D: '↓',
  U: '↑',
  DU: '↓↑',
  S: 'S',
}
