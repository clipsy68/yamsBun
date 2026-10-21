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
  kind: 'fill' | 'cross' | 'near'
}

const SMALL_STRAIGHT_FACES = new Set([1, 2, 3, 4, 5])
const LARGE_STRAIGHT_FACES = new Set([2, 3, 4, 5, 6])
const NEAR_MISS_ROWS = ['q', 'Q', 'F', 'K', 'Y'] as const

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

/** Would the live dice validly fill this specific empty, reachable q/Q/F/K/Y or upper-row (D/U/DU
 * only — column L has its own richer rule, see upperFreeSuggestionKind; S has its own 3+ rule)
 * cell right now? Mirrors CellDialog's diceCriteriaMet, so a suggestion here always means "open
 * this cell now and Confirm is already enabled with the dice as-is" — with one deliberate
 * exception: an upper row on column S only counts as a match with 3+ of that face. Column S is
 * one-shot (first roll only), so a 1-2 match there isn't a real "servit" opportunity worth nudging
 * toward, even though CellDialog would still accept it if confirmed. Chance (m/M) is handled
 * separately below, as a fallback rather than a first-class match. */
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

/**
 * Column L (Liber) has no order lock, so all 6 upper rows are simultaneously reachable at all
 * times — the plain "1+ match -> green" rule used for D/U/DU would light up several of them on
 * almost every roll, which is noisy specifically there. So on L, upper rows get a richer 3-tier
 * rule instead: fewer than 2 matching dice isn't worth a suggestion at all; 2 is a real but weak
 * option, styled as a near-miss hint rather than a confident green fill; 3 or more is a strong,
 * confirmable fill — green PROVIDED it doesn't hurt the upper-section bonus pace, i.e. the live
 * bank (see upperColumnStatus) stays at 0 or above once this row's actual contribution is added
 * (count*face - the 3*face par); if it would leave the bank negative, it's downgraded to the same
 * near-miss styling as the 2-match case. Unlike the q/Q/F/K/Y near-misses, this one isn't gated to
 * "while a reroll remains" — every count here is already directly confirmable right now, so it
 * stays relevant through the final roll too (if anything, more so, since it may be the last
 * decision point of the turn). */
function upperFreeSuggestionKind(dice: DiceState, table: PlayerTable, row: FillableRowKey): 'fill' | 'near' | null {
  const face = faceOf(row)
  const count = countFace(dice, face)
  if (count < 2) return null
  const bank = upperColumnStatus(table, 'L').bank
  const projectedBank = bank + (count * face - 3 * face)
  return count >= 3 && projectedBank >= 0 ? 'fill' : 'near'
}

function chanceWouldFit(dice: DiceState, table: PlayerTable, column: ColumnKey, row: 'm' | 'M'): boolean {
  if (!servitTimingOk(dice, column)) return false
  const sibling = siblingChanceSum(table, column, row)
  if (sibling === null) return true
  const value = column === 'S' ? diceSum(dice) * 2 : diceSum(dice)
  return row === 'm' ? value < sibling : value > sibling
}

/**
 * Which of q/Q/F/K/Y are one reroll away from matching the dice as-is — "worth keeping these dice
 * and rerolling the rest" territory, distinct from an actual match. Each pattern below is mutually
 * exclusive with every other (including its own row's exact-match pattern), so there's never a
 * question of which one "wins" for a given roll:
 *   - K: exactly three of a kind (four+ is already an exact Careu match).
 *   - Y: exactly four of a kind (five is already an exact Yams match) — also a legitimate near-miss
 *     even when the same roll is an exact Full House (3+2), since breaking the pair for a reroll at
 *     the triple is a real option.
 *   - F: exactly two pairs (the lone fifth die is the one to reroll, hoping to match either pair).
 *   - q/Q: exactly 4 distinct faces, where that 4-value set sits entirely inside the small and/or
 *     large straight's 5-value set — e.g. {2,3,4,5} is one reroll from EITHER straight (the 5th die
 *     could come up 1 or 6), so both q and Q apply at once there; {1,2,3,4} only reaches q (a 6
 *     can't complete it), {3,4,5,6} only reaches Q.
 */
function nearMissRows(dice: DiceState): Set<FillableRowKey> {
  const near = new Set<FillableRowKey>()
  const counts = new Map<number, number>()
  for (const f of dice.faces) counts.set(f, (counts.get(f) ?? 0) + 1)
  const countValues = [...counts.values()]
  const maxCount = Math.max(...countValues)
  const pairCount = countValues.filter((c) => c === 2).length

  if (maxCount === 3) near.add('K')
  if (maxCount === 4) near.add('Y')
  if (pairCount === 2) near.add('F')

  const distinct = new Set(dice.faces)
  if (distinct.size === 4) {
    const within = (target: Set<number>) => [...distinct].every((f) => target.has(f))
    if (within(SMALL_STRAIGHT_FACES)) near.add('q')
    if (within(LARGE_STRAIGHT_FACES)) near.add('Q')
  }

  return near
}

/**
 * The cells the current roll would validly fill right now, for "Learning mode". Reuses the same
 * validation CellDialog already enforces (countFace, the detect-* helpers, isRowUnlocked,
 * siblingChanceSum) so a
 * suggestion here always matches what the dialog would actually accept — never a separate opinion
 * about what's "good" play. Pure and dice/table-only so it can be reused later for a virtual-bot
 * player without rework (see the Learning Mode plan this was built from).
 *
 * While a reroll is still available (rollsUsed < 3), also surfaces "near-miss" nudges — see
 * nearMissRows — alongside any exact matches; these never apply once the turn's last roll is spent,
 * since there's nothing left to reroll for by then.
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
      if (column === 'L' && (UPPER_ROWS as readonly string[]).includes(row)) {
        const kind = upperFreeSuggestionKind(dice, table, row)
        if (kind) fills.push({ column, row, kind })
        continue
      }
      if (diceMatchesCell(dice, column, row)) fills.push({ column, row, kind: 'fill' })
    }
  }

  if (dice.rollsUsed < 3) {
    // Near-miss nudges only make sense while a reroll is still possible — and never for column S,
    // since chasing one always means rolling again, which disqualifies S's first-roll-only rule
    // before the completed combination could ever be banked there.
    const near = nearMissRows(dice)
    for (const column of COLUMNS) {
      if (column === 'S' || near.size === 0) continue
      for (const row of NEAR_MISS_ROWS) {
        if (!near.has(row)) continue
        if (!isReachableEmpty(table, column, row)) continue
        fills.push({ column, row, kind: 'near' })
      }
    }
    return fills
  }

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
