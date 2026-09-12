export type ColumnKey = 'L' | 'D' | 'U' | 'DU' | 'S'
export const COLUMNS: ColumnKey[] = ['L', 'D', 'U', 'DU', 'S']

export type UpperRowKey = '1' | '2' | '3' | '4' | '5' | '6'
export const UPPER_ROWS: UpperRowKey[] = ['1', '2', '3', '4', '5', '6']

export type LowerRowKey = 'q' | 'Q' | 'F' | 'K' | 'Y' | 'm' | 'M'
export const LOWER_ROWS: LowerRowKey[] = ['q', 'Q', 'F', 'K', 'Y', 'm', 'M']

/** Every fillable row in top-to-bottom (docx) order — 'Tot' is computed, not fillable. */
export type FillableRowKey = UpperRowKey | LowerRowKey
export const ALL_ROWS: FillableRowKey[] = [...UPPER_ROWS, ...LOWER_ROWS]

/**
 * One cell in a player's table. `kind` tags which row-category it belongs to;
 * callers are expected to only construct the variant that matches the row
 * they're filling (upper rows -> 'upper', q/Q -> 'fixed', F -> 'fullHouse',
 * K -> 'fourKind', Y -> 'yams', m/M -> 'chance').
 */
export type Cell =
  | { kind: 'empty' }
  | { kind: 'crossed' }
  | { kind: 'upper'; count: number } // dice showing this row's face, 0-5
  | { kind: 'fixed'; servit: boolean } // q, Q — servit only meaningful outside column S
  | { kind: 'fullHouse'; tripleFace: number; pairFace: number; servit: boolean }
  | { kind: 'fourKind'; face: number; servit: boolean }
  | { kind: 'yams'; face: number; servit: boolean }
  | { kind: 'chance'; sum: number } // m, M

export type PlayerTable = Record<ColumnKey, Record<FillableRowKey, Cell>>

export interface Player {
  id: string
  name: string
  table: PlayerTable
}

export interface GameSetup {
  playerCount: number
  gameType: 'fizic' | 'virtual'
  names: string[]
  showLiveTotal: boolean
}

export interface GameState {
  players: Player[]
  activePlayerIndex: number
  gameType: 'fizic' | 'virtual'
  showLiveTotal: boolean
  startedAt: number
}
