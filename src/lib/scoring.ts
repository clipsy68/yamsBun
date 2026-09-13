import {
  ALL_ROWS,
  COLUMNS,
  LOWER_ROWS,
  UPPER_ROWS,
  type Cell,
  type ColumnKey,
  type FillableRowKey,
  type PlayerTable,
} from './types'

export const UPPER_BONUS_TARGET = 63
export const UPPER_BONUS_POINTS = 50
export const SERVIT_OUTSIDE_S_BONUS = 10

export function emptyCell(): Cell {
  return { kind: 'empty' }
}

export function createEmptyTable(): PlayerTable {
  const table = {} as PlayerTable
  for (const column of COLUMNS) {
    const row = {} as Record<FillableRowKey, Cell>
    for (const r of ALL_ROWS) row[r] = emptyCell()
    table[column] = row
  }
  return table
}

/**
 * Column fill-order rules. Each entry is a list of independent sequences;
 * within a sequence, earlier rows must be resolved (filled or crossed)
 * before a later one unlocks. An empty array means the column is free.
 * `DU` has two independent sequences (per the game's rule: starts from the
 * middle, outward in both directions) so either side can be worked in any
 * order relative to the other, but each side keeps its own order.
 */
export const ORDER_SEQUENCES: Record<ColumnKey, FillableRowKey[][]> = {
  L: [],
  D: [['1', '2', '3', '4', '5', '6', 'q', 'Q', 'F', 'K', 'Y', 'm', 'M']],
  U: [['M', 'm', 'Y', 'K', 'F', 'Q', 'q', '6', '5', '4', '3', '2', '1']],
  DU: [
    ['6', '5', '4', '3', '2', '1'],
    ['q', 'Q', 'F', 'K', 'Y', 'm', 'M'],
  ],
  S: [],
}

/** Whether a cell can be tapped to fill/cross, given what else is resolved in that column. */
export function isRowUnlocked(table: PlayerTable, column: ColumnKey, row: FillableRowKey): boolean {
  const sequences = ORDER_SEQUENCES[column]
  if (sequences.length === 0) return true
  for (const seq of sequences) {
    const idx = seq.indexOf(row)
    if (idx === -1) continue
    for (let i = 0; i < idx; i++) {
      if (table[column][seq[i]].kind === 'empty') return false
    }
    return true
  }
  return true
}

function faceOf(row: (typeof UPPER_ROWS)[number]): number {
  return Number(row)
}

/** Points a single cell contributes, given which row/column it's in (S doubles, servit adds outside S). */
export function cellPoints(cell: Cell, row: FillableRowKey, column: ColumnKey): number {
  switch (cell.kind) {
    case 'empty':
    case 'crossed':
      return 0
    case 'upper':
      return cell.count * faceOf(row as (typeof UPPER_ROWS)[number])
    case 'fixed': {
      const base = row === 'q' ? 35 : 45
      if (column === 'S') return base * 2
      return base + (cell.servit ? SERVIT_OUTSIDE_S_BONUS : 0)
    }
    case 'fullHouse': {
      const base = cell.tripleFace * 3 + cell.pairFace * 2 + 30
      if (column === 'S') return base * 2
      return base + (cell.servit ? SERVIT_OUTSIDE_S_BONUS : 0)
    }
    case 'fourKind': {
      const base = cell.face * 4 + 40
      if (column === 'S') return base * 2
      return base + (cell.servit ? SERVIT_OUTSIDE_S_BONUS : 0)
    }
    case 'yams': {
      const base = cell.face * 5 + 100
      if (column === 'S') return base * 2
      return base + (cell.servit ? SERVIT_OUTSIDE_S_BONUS : 0)
    }
    case 'chance':
      return cell.sum
  }
}

export interface UpperColumnStatus {
  /** true once all 6 upper rows are filled or crossed. */
  complete: boolean
  /** Live "bank": sum of (points - 3×face) across resolved rows; a crossed row counts as 0 points. */
  bank: number
  /** Real total (sum + bonus, ×2 on column S) — only set once `complete`. */
  total: number | null
}

export function upperColumnStatus(table: PlayerTable, column: ColumnKey): UpperColumnStatus {
  let sum = 0
  let bank = 0
  let resolvedCount = 0

  for (const row of UPPER_ROWS) {
    const cell = table[column][row]
    if (cell.kind === 'upper') {
      const points = cellPoints(cell, row, column)
      sum += points
      bank += points - 3 * faceOf(row)
      resolvedCount++
    } else if (cell.kind === 'crossed') {
      bank += 0 - 3 * faceOf(row)
      resolvedCount++
    }
  }

  const complete = resolvedCount === UPPER_ROWS.length
  if (!complete) return { complete: false, bank, total: null }

  const bonus = sum >= UPPER_BONUS_TARGET ? UPPER_BONUS_POINTS : 0
  const raw = sum + bonus
  return { complete: true, bank, total: column === 'S' ? raw * 2 : raw }
}

export function lowerColumnTotal(table: PlayerTable, column: ColumnKey): number {
  let sum = 0
  for (const row of LOWER_ROWS) sum += cellPoints(table[column][row], row, column)
  return sum
}

/** Grand total for a player: sum of all 5 columns' upper totals (only once complete) + lower totals. */
export function playerGrandTotal(table: PlayerTable): number {
  let total = 0
  for (const column of COLUMNS) {
    const upper = upperColumnStatus(table, column)
    total += upper.total ?? 0
    total += lowerColumnTotal(table, column)
  }
  return total
}

export function isTableComplete(table: PlayerTable): boolean {
  return COLUMNS.every((column) => ALL_ROWS.every((row) => table[column][row].kind !== 'empty'))
}
