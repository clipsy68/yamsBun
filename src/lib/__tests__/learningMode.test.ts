import { describe, expect, it } from 'vitest'
import { suggestedCells } from '../learningMode'
import { createEmptyTable } from '../scoring'
import { freshDice, type DiceState } from '../dice'
import { ALL_ROWS } from '../types'

function withFaces(faces: number[], rollsUsed = 1): DiceState {
  return { ...freshDice(), faces, rollsUsed }
}

describe('suggestedCells', () => {
  it('suggests nothing before the first roll', () => {
    expect(suggestedCells(withFaces([3, 3, 3, 1, 2], 0), createEmptyTable())).toEqual([])
  })

  it("the user's first worked example: three 3s suggests the Servit '3' row", () => {
    const result = suggestedCells(withFaces([3, 3, 3, 1, 2]), createEmptyTable())
    expect(result).toContainEqual({ column: 'S', row: '3', kind: 'fill' })
  })

  it("the user's second worked example: three 3s + two 6s suggests BOTH Servit '3' and Servit Full House", () => {
    const result = suggestedCells(withFaces([3, 3, 3, 6, 6]), createEmptyTable())
    expect(result).toContainEqual({ column: 'S', row: '3', kind: 'fill' })
    expect(result).toContainEqual({ column: 'S', row: 'F', kind: 'fill' })
    // and the same combination is just as valid outside the Servit column
    expect(result).toContainEqual({ column: 'L', row: '3', kind: 'fill' })
    expect(result).toContainEqual({ column: 'L', row: 'F', kind: 'fill' })
  })

  it('requires 3+ of a kind for an upper row (1-6) suggestion on column S', () => {
    // only two 3s on the dice — not enough to suggest Servit '3' at all
    const result = suggestedCells(withFaces([3, 3, 1, 2, 6]), createEmptyTable())
    expect(result.find((s) => s.column === 'S' && s.row === '3')).toBeUndefined()
  })

  describe('column L (Liber) upper-row 3-tier rule — no order lock means all 6 rows are always reachable at once', () => {
    it('suggests nothing for a single matching die (count 1)', () => {
      const result = suggestedCells(withFaces([3, 1, 2, 4, 6]), createEmptyTable())
      expect(result.find((s) => s.column === 'L' && s.row === '3')).toBeUndefined()
    })

    it('suggests a near-miss (not green) for exactly 2 matching dice', () => {
      const result = suggestedCells(withFaces([3, 3, 1, 2, 6]), createEmptyTable())
      expect(result).toContainEqual({ column: 'L', row: '3', kind: 'near' })
    })

    it('suggests green for 3+ matching dice when the bank stays non-negative', () => {
      // empty table -> bank starts at 0; three 3s keeps it at par (0)
      const result = suggestedCells(withFaces([3, 3, 3, 1, 2]), createEmptyTable())
      expect(result).toContainEqual({ column: 'L', row: '3', kind: 'fill' })
    })

    it('downgrades to a near-miss when 3+ matching dice would still leave the bank negative', () => {
      const table = createEmptyTable()
      // crossing every other upper row of L pulls the bank well into the negative
      for (const row of ['1', '2', '4', '5', '6'] as const) table.L[row] = { kind: 'crossed' }
      // bank is now -(3*1+3*2+3*4+3*5+3*6) = -54; three 3s only adds 9-9=0, bank stays -54
      const result = suggestedCells(withFaces([3, 3, 3, 1, 2]), table)
      expect(result).toContainEqual({ column: 'L', row: '3', kind: 'near' })
    })

    it('still suggests green for 4+ matching dice when that recovers a negative bank to 0+', () => {
      const table = createEmptyTable()
      // bank at -3 (one crossed row '1', par 3, achieved 0)
      table.L['1'] = { kind: 'crossed' }
      // four 6s: contributes 24 - 18(par) = +6 -> projected bank = -3 + 6 = 3 >= 0
      const result = suggestedCells(withFaces([6, 6, 6, 6, 1]), table)
      expect(result).toContainEqual({ column: 'L', row: '6', kind: 'fill' })
    })

    it('keeps suggesting (as near, not gated by roll number) a weak upper-row L option on the final roll', () => {
      const result = suggestedCells(withFaces([3, 3, 1, 2, 6], 3), createEmptyTable())
      expect(result).toContainEqual({ column: 'L', row: '3', kind: 'near' })
    })

    it('D/U/DU keep the simple 1+ -> green rule (only L gets the richer treatment)', () => {
      const result = suggestedCells(withFaces([1, 2, 3, 4, 6]), createEmptyTable())
      // D's order starts at '1', so a single 1 there is a real, confirmable fill
      expect(result).toContainEqual({ column: 'D', row: '1', kind: 'fill' })
    })
  })

  it('stops suggesting column S once the dice have been rolled more than once, but keeps suggesting elsewhere', () => {
    const result = suggestedCells(withFaces([3, 3, 3, 6, 6], 2), createEmptyTable())
    expect(result.find((s) => s.column === 'S')).toBeUndefined()
    expect(result).toContainEqual({ column: 'L', row: '3', kind: 'fill' })
    expect(result).toContainEqual({ column: 'L', row: 'F', kind: 'fill' })
  })

  it('never suggests Chance or a cross-out before the final (3rd) roll, even with nothing else matching', () => {
    const table = createEmptyTable()
    for (const row of ALL_ROWS) {
      if (row !== 'm') table.L[row] = { kind: 'crossed' }
    }
    for (const column of ['D', 'U', 'DU', 'S'] as const) {
      for (const row of ALL_ROWS) table[column][row] = { kind: 'crossed' }
    }
    expect(suggestedCells(withFaces([1, 1, 1, 1, 1], 1), table)).toEqual([])
    expect(suggestedCells(withFaces([1, 1, 1, 1, 1], 2), table)).toEqual([])
  })

  it('suggests Chance (m) on the final roll when nothing else matches', () => {
    const table = createEmptyTable()
    for (const row of ALL_ROWS) {
      if (row !== 'm') table.L[row] = { kind: 'crossed' }
    }
    for (const column of ['D', 'U', 'DU', 'S'] as const) {
      for (const row of ALL_ROWS) table[column][row] = { kind: 'crossed' }
    }
    const result = suggestedCells(withFaces([1, 1, 1, 1, 1], 3), table)
    expect(result).toEqual([{ column: 'L', row: 'm', kind: 'fill' }])
  })

  it("doesn't suggest Chance when there are already 2+ other matches", () => {
    const table = createEmptyTable()
    for (const row of ALL_ROWS) {
      if (row !== '1' && row !== '2' && row !== 'm') table.L[row] = { kind: 'crossed' }
    }
    for (const column of ['D', 'U', 'DU', 'S'] as const) {
      for (const row of ALL_ROWS) table[column][row] = { kind: 'crossed' }
    }
    const result = suggestedCells(withFaces([1, 1, 2, 2, 2], 3), table)
    expect(result).toHaveLength(2)
    expect(result.find((s) => s.row === 'm')).toBeUndefined()
  })

  it("respects mici<mari: doesn't suggest 'm' when it would score >= the sibling 'M'", () => {
    const table = createEmptyTable()
    for (const row of ALL_ROWS) {
      if (row !== 'm') table.L[row] = { kind: 'crossed' }
    }
    table.L.M = { kind: 'chance', sum: 20 }
    for (const column of ['D', 'U', 'DU', 'S'] as const) {
      for (const row of ALL_ROWS) table[column][row] = { kind: 'crossed' }
    }
    // five 6s -> sum 30, which is >= the sibling M's 20, so 'm' can't legally take it — with
    // nothing else open anywhere, that correctly falls through to suggesting 'm' be crossed out
    // instead (there's genuinely nothing left to fill).
    const result = suggestedCells(withFaces([6, 6, 6, 6, 6], 3), table)
    expect(result).toEqual([{ column: 'L', row: 'm', kind: 'cross' }])
  })

  it('falls back to a single cross-out suggestion when nothing can be filled anywhere', () => {
    const table = createEmptyTable()
    // Resolve every other upper row of L exactly at par (3x face), so the live bank sits at 0 once
    // row '1' is the only one left open — "on pace" for the 63-point bonus.
    table.L['2'] = { kind: 'upper', count: 3 }
    table.L['3'] = { kind: 'upper', count: 3 }
    table.L['4'] = { kind: 'upper', count: 3 }
    table.L['5'] = { kind: 'upper', count: 3 }
    table.L['6'] = { kind: 'upper', count: 3 }
    table.L.Q = { kind: 'crossed' }
    table.L.F = { kind: 'crossed' }
    table.L.K = { kind: 'crossed' }
    table.L.Y = { kind: 'crossed' }
    table.L.m = { kind: 'crossed' }
    table.L.M = { kind: 'crossed' }
    // L['1'] and L.q stay empty — nothing on the dice matches either, so the fallback must pick one
    for (const column of ['D', 'U', 'DU', 'S'] as const) {
      for (const row of ALL_ROWS) table[column][row] = { kind: 'crossed' }
    }
    const result = suggestedCells(withFaces([6, 6, 6, 6, 6], 3), table)
    // row '1' is still "on pace" (bank 0) so it must be skipped in favor of the lower-section row
    expect(result).toEqual([{ column: 'L', row: 'q', kind: 'cross' }])
  })

  it('cross-out fallback DOES include an upper row once its column bank has gone negative', () => {
    const table = createEmptyTable()
    table.L['2'] = { kind: 'crossed' } // 0 vs 6 par -> bank -6, behind pace
    table.L['3'] = { kind: 'upper', count: 3 }
    table.L['4'] = { kind: 'upper', count: 3 }
    table.L['5'] = { kind: 'upper', count: 3 }
    table.L['6'] = { kind: 'upper', count: 3 }
    table.L.Q = { kind: 'crossed' }
    table.L.F = { kind: 'crossed' }
    table.L.K = { kind: 'crossed' }
    table.L.Y = { kind: 'crossed' }
    table.L.m = { kind: 'crossed' }
    table.L.M = { kind: 'crossed' }
    for (const column of ['D', 'U', 'DU', 'S'] as const) {
      for (const row of ALL_ROWS) table[column][row] = { kind: 'crossed' }
    }
    const result = suggestedCells(withFaces([6, 6, 6, 6, 6], 3), table)
    expect(result).toEqual([{ column: 'L', row: '1', kind: 'cross' }])
  })

  describe('near-miss nudges (one reroll away, only while rerolls remain)', () => {
    it("the user's worked example: 2,3,4,5 present suggests BOTH q and Q as near-misses", () => {
      const result = suggestedCells(withFaces([2, 3, 4, 5, 2]), createEmptyTable())
      expect(result).toContainEqual({ column: 'L', row: 'q', kind: 'near' })
      expect(result).toContainEqual({ column: 'L', row: 'Q', kind: 'near' })
    })

    it('4 distinct faces within only the small straight suggests q but not Q', () => {
      const result = suggestedCells(withFaces([1, 2, 3, 4, 1]), createEmptyTable())
      expect(result).toContainEqual({ column: 'L', row: 'q', kind: 'near' })
      expect(result.find((s) => s.row === 'Q')).toBeUndefined()
    })

    it('4 distinct faces within only the large straight suggests Q but not q', () => {
      const result = suggestedCells(withFaces([3, 4, 5, 6, 3]), createEmptyTable())
      expect(result).toContainEqual({ column: 'L', row: 'Q', kind: 'near' })
      expect(result.find((s) => s.row === 'q')).toBeUndefined()
    })

    it('exactly three of a kind suggests Careu (K) as a near-miss', () => {
      const result = suggestedCells(withFaces([5, 5, 5, 1, 2]), createEmptyTable())
      expect(result).toContainEqual({ column: 'L', row: 'K', kind: 'near' })
    })

    it('exactly four of a kind suggests Yams (Y) as a near-miss', () => {
      const result = suggestedCells(withFaces([4, 4, 4, 4, 1]), createEmptyTable())
      expect(result).toContainEqual({ column: 'L', row: 'Y', kind: 'near' })
    })

    it('two pairs suggests Full House (F) as a near-miss', () => {
      const result = suggestedCells(withFaces([2, 2, 3, 3, 4]), createEmptyTable())
      expect(result).toContainEqual({ column: 'L', row: 'F', kind: 'near' })
    })

    it('never suggests a q/Q/F/K/Y near-miss on the final (3rd) roll', () => {
      const result = suggestedCells(withFaces([2, 3, 4, 5, 2], 3), createEmptyTable())
      expect(result.find((s) => s.kind === 'near' && s.row !== '2')).toBeUndefined()
      // the upper-row-L 2-match case is a different, roll-independent mechanism (see its own
      // describe block below) — it's expected to still show here, unrelated to this gating rule
      expect(result).toContainEqual({ column: 'L', row: '2', kind: 'near' })
    })

    it('never suggests a near-miss on column S, even on the first roll', () => {
      const result = suggestedCells(withFaces([5, 5, 5, 1, 2]), createEmptyTable())
      expect(result.find((s) => s.kind === 'near' && s.column === 'S')).toBeUndefined()
    })

    it('respects column order locks and already-filled cells for near-misses too', () => {
      const table = createEmptyTable()
      // D's order starts at '1' — K is locked there until 1..Y are resolved
      const result = suggestedCells(withFaces([5, 5, 5, 1, 2]), table)
      expect(result.find((s) => s.kind === 'near' && s.column === 'D')).toBeUndefined()
    })
  })
})
