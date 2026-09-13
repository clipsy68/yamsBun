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

/** Formats a duration in milliseconds as "Xh Ymin" (or "Xmin" under an hour). */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  return `${hours}h ${minutes}min`
}

/** Formats elapsed milliseconds as a live "MM:SS" (or "H:MM:SS" past an hour) ticking counter. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}
