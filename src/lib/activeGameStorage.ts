import type { DiceState } from './dice'
import type { ColumnKey, FillableRowKey, Player } from './types'

const STORAGE_KEY = 'yamsbun.activeGame.v1'

/** Matches the subset of GameContext's State needed to resume an in-progress game. */
export interface PersistedActiveGame {
  screen: unknown
  players: Player[]
  activePlayerIndex: number
  gameType: 'fizic' | 'virtual'
  showLiveTotal: boolean
  dice: DiceState
  turnFilledCell: { column: ColumnKey; row: FillableRowKey } | null
  startedAt: number | null
}

export function saveActiveGame(state: PersistedActiveGame): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage failures (e.g. private browsing quota)
  }
}

export function loadActiveGame(): PersistedActiveGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedActiveGame
  } catch {
    return null
  }
}

export function clearActiveGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
