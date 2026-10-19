import { ALL_ROWS, COLUMNS, UPPER_ROWS, type ColumnKey, type FillableRowKey, type PlayerTable } from './types'
import { isRowUnlocked, siblingChanceSum, upperColumnStatus } from './scoring'
import {
  countFace,
  detectFourKind,
  detectFullHouse,
  detectLargeStraight,
  detectSmallStraight,
  detectYams,
  diceSum,
  type DiceState,
} from './dice'

export interface CellSuggestion {
  column: ColumnKey
  row: FillableRowKey
  kind: 'fill' | 'cross'
}

function faceOf(row: string): number {
  return Number(row)
}

function isReachableEmpty(table: PlayerTable, column: ColumnKey, row: FillableRowKey): boolean {
  return table[column][row].kind === 'empty' && isRowUnlocked(table, column, row)
}

// Column S requires the cell to be filled off the first roll only (mirrors CellDialog's
// columnSBlocked, which blanket-blocks confirming ANY row on S once rollsUsed > 1, not just the
// combination rows).
function servitTimingOk(dice: DiceState, column: ColumnKey): boolean {
  return column !== 'S' || dice.rollsUsed <= 1
}

/** Would the live dice validly fill this specific empty, reachable q/Q/F/K/Y or upper-row cell
 * right now? Mirrors CellDialog's diceCriteriaMet, so a suggestion here always means "open this
 * cell now and Confirm is already enabled with the dice as-is" — with one deliberate exception: an
 * upper row (1-6) on column S only counts as a match with 3+ of that face. Column S is one-shot
 * (first roll only), so a 1-2 match there isn't a real "servit" opportunity worth nudging toward,
 * even though CellDialog would still accept it if confirmed. Chance (m/M) is handled separately
 * below, as a fallback rather than a first-class match. */
function diceMatchesCell(dice: DiceState, column: ColumnKey, row: FillableRowKey): boolean {
  if (!servitTimingOk(dice, column)) return false
  if ((UPPER_ROWS as readonly string[]).includes(row)) {
    const count = countFace(dice, faceOf(row))
    return column === 'S' ? count >= 3 : count >= 1
  }
  switch (row) {
    case 'q':
      return detectSmallStraight(dice)
    case 'Q':
      return detectLargeStraight(dice)
    case 'F':
      return detectFullHouse(dice) !== null
    case 'K':
      return detectFourKind(dice) !== null
    case 'Y':
      return detectYams(dice) !== null
    default:
      return false
  }
}

function chanceWouldFit(dice: DiceState, table: PlayerTable, column: ColumnKey, row: 'm' | 'M'): boolean {
  if (!servitTimingOk(dice, column)) return false
  const sibling = siblingChanceSum(table, column, row)
  if (sibling === null) return true
  const value = column === 'S' ? diceSum(dice) * 2 : diceSum(dice)
  return row === 'm' ? value < sibling : value > sibling
}

/**
 * The cells the current roll would validly fill right now, for "Learning mode". Reuses the same
 * validation CellDialog already enforces (countFace, the detect-* helpers, isRowUnlocked,
 * siblingChanceSum) so a
 * suggestion here always matches what the dialog would actually accept — never a separate opinion
 * about what's "good" play. Pure and dice/table-only so it can be reused later for a virtual-bot
 * player without rework (see the Learning Mode plan this was built from).
 *
 * Chance (m/M) and the cross-out fallback are both "give up on something more specific" moves, so
 * neither is considered before the turn's last roll (rollsUsed === 3) — suggesting either earlier
 * would nudge a player to settle while they could still reroll for something better. Once on the
 * last roll: Chance is only considered when there are 0 or 1 other matches, so it doesn't drown out
 * more specific suggestions; if STILL nothing matches anywhere (not even chance), falls back to a
 * single cross-out suggestion — skipping upper rows 1-6 unless that column's live bank is already
 * negative (behind pace for the 63-point bonus), so it doesn't nudge a player to give up on the
 * bonus while they're still realistically on track for it.
 */
export function suggestedCells(dice: DiceState, table: PlayerTable): CellSuggestion[] {
  if (dice.rollsUsed === 0) return []

  const fills: CellSuggestion[] = []
  for (const column of COLUMNS) {
    for (const row of ALL_ROWS) {
      if (row === 'm' || row === 'M') continue
      if (!isReachableEmpty(table, column, row)) continue
      if (diceMatchesCell(dice, column, row)) fills.push({ column, row, kind: 'fill' })
    }
  }

  if (dice.rollsUsed < 3) return fills

  if (fills.length <= 1) {
    for (const column of COLUMNS) {
      for (const row of ['m', 'M'] as const) {
        if (!isReachableEmpty(table, column, row)) continue
        if (chanceWouldFit(dice, table, column, row)) fills.push({ column, row, kind: 'fill' })
      }
    }
  }

  if (fills.length > 0) return fills

  for (const column of COLUMNS) {
    for (const row of ALL_ROWS) {
      if (!isReachableEmpty(table, column, row)) continue
      if ((UPPER_ROWS as readonly string[]).includes(row) && upperColumnStatus(table, column).bank >= 0) continue
      return [{ column, row, kind: 'cross' }]
    }
  }
  return []
}
