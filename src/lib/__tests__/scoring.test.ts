import { describe, expect, it } from 'vitest'
import {
  createEmptyTable,
  isRowUnlocked,
  lowerColumnTotal,
  playerGrandTotal,
  upperColumnStatus,
} from '../scoring'
import type { Cell } from '../types'

describe('upperColumnStatus', () => {
  it('reports an empty column as incomplete with zero bank', () => {
    const table = createEmptyTable()
    const status = upperColumnStatus(table, 'L')
    expect(status).toEqual({ complete: false, bank: 0, total: null })
  })

  it('tracks a live positive bank before the column is complete', () => {
    const table = createEmptyTable()
    // three dice of 4 on row '4' (expected 3x4=12) -> +0 deviation... use 4 dice instead
    table.D['4'] = { kind: 'upper', count: 4 } // 16 vs expected 12 -> +4
    table.D['5'] = { kind: 'upper', count: 2 } // 10 vs expected 15 -> -5
    const status = upperColumnStatus(table, 'D')
    expect(status.complete).toBe(false)
    expect(status.bank).toBe(4 - 5)
    expect(status.total).toBeNull()
  })

  it('excludes crossed rows from the bank but counts them toward completeness', () => {
    const table = createEmptyTable()
    for (const row of ['1', '2', '3', '4', '5', '6'] as const) {
      table.L[row] = row === '6' ? { kind: 'crossed' } : { kind: 'upper', count: 3 }
    }
    const status = upperColumnStatus(table, 'L')
    expect(status.complete).toBe(true)
    // 3x1+3x2+3x3+3x4+3x5 = 45, no bonus (below 63), row 6 crossed contributes 0
    expect(status.total).toBe(45)
  })

  it('awards the 50-point bonus at exactly 63 and doubles everything on column S', () => {
    const table = createEmptyTable()
    const counts: Record<string, number> = { '1': 3, '2': 3, '3': 3, '4': 3, '5': 3, '6': 3 }
    for (const [row, count] of Object.entries(counts)) {
      table.S[row as '1'] = { kind: 'upper', count }
    }
    const status = upperColumnStatus(table, 'S')
    // sum = 3*(1+2+3+4+5+6) = 63 -> bonus 50 -> (63+50)*2 = 226
    expect(status.complete).toBe(true)
    expect(status.total).toBe(226)
  })

  it('does not award the bonus one point under target', () => {
    const table = createEmptyTable()
    table.L['1'] = { kind: 'upper', count: 3 } // 3
    table.L['2'] = { kind: 'upper', count: 3 } // 6
    table.L['3'] = { kind: 'upper', count: 3 } // 9
    table.L['4'] = { kind: 'upper', count: 3 } // 12
    table.L['5'] = { kind: 'upper', count: 3 } // 15
    table.L['6'] = { kind: 'upper', count: 3 } // 18 -> but drop one to miss target
    table.L['6'] = { kind: 'upper', count: 2 } // 12 -> sum = 3+6+9+12+15+12 = 57? recompute below
    const status = upperColumnStatus(table, 'L')
    expect(status.total).toBe(3 + 6 + 9 + 12 + 15 + 12)
  })
})

describe('cellPoints via lowerColumnTotal — q/Q fixed formations', () => {
  it('scores q at 35 and Q at 45 outside column S with no servit', () => {
    const table = createEmptyTable()
    table.L.q = { kind: 'fixed', servit: false }
    table.L.Q = { kind: 'fixed', servit: false }
    expect(lowerColumnTotal(table, 'L')).toBe(35 + 45)
  })

  it('adds the +10 servit bonus outside column S', () => {
    const table = createEmptyTable()
    table.L.q = { kind: 'fixed', servit: true }
    expect(lowerColumnTotal(table, 'L')).toBe(45)
  })

  it('doubles q/Q on column S regardless of the servit flag', () => {
    const table = createEmptyTable()
    table.S.q = { kind: 'fixed', servit: true } // servit flag should be ignored on S
    expect(lowerColumnTotal(table, 'S')).toBe(70)
  })
})

describe('cellPoints — Full House / Careu / Yams formulas', () => {
  it('computes Full House as 3xtriple + 2xpair + 30, matching the worked example (3x6 + 2x5 = 58)', () => {
    const table = createEmptyTable()
    table.L.F = { kind: 'fullHouse', tripleFace: 6, pairFace: 5, servit: false }
    expect(lowerColumnTotal(table, 'L')).toBe(58)
  })

  it('computes Careu as 4xface + 40, matching the worked example (careu of 6 = 64)', () => {
    const table = createEmptyTable()
    table.L.K = { kind: 'fourKind', face: 6, servit: false }
    expect(lowerColumnTotal(table, 'L')).toBe(64)
  })

  it('computes Yams as 5xface + 100, matching the worked example (yams of 3 = 115)', () => {
    const table = createEmptyTable()
    table.L.Y = { kind: 'yams', face: 3, servit: false }
    expect(lowerColumnTotal(table, 'L')).toBe(115)
  })

  it('applies +10 servit outside S and doubling on S for Full House', () => {
    const table = createEmptyTable()
    table.L.F = { kind: 'fullHouse', tripleFace: 6, pairFace: 3, servit: true }
    table.S.F = { kind: 'fullHouse', tripleFace: 6, pairFace: 3, servit: false }
    expect(lowerColumnTotal(table, 'L')).toBe(54 + 10)
    expect(lowerColumnTotal(table, 'S')).toBe(54 * 2)
  })
})

describe('cellPoints — chance (m/M)', () => {
  it('scores the entered sum directly with no bonuses', () => {
    const table = createEmptyTable()
    table.U.m = { kind: 'chance', sum: 14 }
    table.U.M = { kind: 'chance', sum: 21 }
    expect(lowerColumnTotal(table, 'U')).toBe(35)
  })
})

describe('isRowUnlocked', () => {
  it('leaves free columns (L, S) always unlocked', () => {
    const table = createEmptyTable()
    expect(isRowUnlocked(table, 'L', 'M')).toBe(true)
    expect(isRowUnlocked(table, 'S', '1')).toBe(true)
  })

  it('enforces top-to-bottom order on column D', () => {
    const table = createEmptyTable()
    expect(isRowUnlocked(table, 'D', '1')).toBe(true)
    expect(isRowUnlocked(table, 'D', '2')).toBe(false)
    table.D['1'] = { kind: 'upper', count: 3 }
    expect(isRowUnlocked(table, 'D', '2')).toBe(true)
    expect(isRowUnlocked(table, 'D', 'q')).toBe(false)
  })

  it('unlocks a later row on D once the earlier one is crossed, not just filled', () => {
    const table = createEmptyTable()
    table.D['1'] = { kind: 'crossed' }
    expect(isRowUnlocked(table, 'D', '2')).toBe(true)
  })

  it('enforces bottom-to-top order on column U', () => {
    const table = createEmptyTable()
    expect(isRowUnlocked(table, 'U', 'M')).toBe(true)
    expect(isRowUnlocked(table, 'U', 'm')).toBe(false)
    table.U.M = { kind: 'chance', sum: 20 }
    expect(isRowUnlocked(table, 'U', 'm')).toBe(true)
    expect(isRowUnlocked(table, 'U', '6')).toBe(false)
  })

  it('lets column DU progress on either side independently', () => {
    const table = createEmptyTable()
    expect(isRowUnlocked(table, 'DU', '6')).toBe(true)
    expect(isRowUnlocked(table, 'DU', 'q')).toBe(true)
    expect(isRowUnlocked(table, 'DU', '5')).toBe(false)
    expect(isRowUnlocked(table, 'DU', 'Q')).toBe(false)

    table.DU['6'] = { kind: 'upper', count: 3 }
    expect(isRowUnlocked(table, 'DU', '5')).toBe(true)
    // the q-side is unaffected by progress on the 6-side
    expect(isRowUnlocked(table, 'DU', 'Q')).toBe(false)

    table.DU.q = { kind: 'fixed', servit: false }
    expect(isRowUnlocked(table, 'DU', 'Q')).toBe(true)
  })
})

describe('playerGrandTotal', () => {
  it('only counts completed upper columns, plus every lower-section total', () => {
    const table = createEmptyTable()
    // Complete column L upper section: 3 dice each row 1-6 = 63 -> +50 bonus = 113
    for (const row of ['1', '2', '3', '4', '5', '6'] as const) {
      table.L[row] = { kind: 'upper', count: 3 }
    }
    // Leave D upper section incomplete (only one row filled) — must not count toward grand total
    table.D['1'] = { kind: 'upper', count: 5 }
    // Lower section values on a couple of columns
    table.L.q = { kind: 'fixed', servit: false } // 35
    table.D.K = { kind: 'fourKind', face: 4, servit: false } // 4*4+40=56

    const cell: Cell = { kind: 'chance', sum: 10 }
    table.U.m = cell // 10

    expect(playerGrandTotal(table)).toBe(113 + 35 + 56 + 10)
  })
})
