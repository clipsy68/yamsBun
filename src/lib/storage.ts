import type { PlayerTable } from './types'

export interface HistoryEntry {
  id: string
  startedAt: string // ISO timestamp
  finishedAt: string // ISO timestamp
  players: { name: string; total: number }[]
  winnerNames: string[] // more than one name means a tie at the top score
  winnerScore: number
  tables: { name: string; table: PlayerTable }[]
}

const STORAGE_KEY = 'yamsbun.history.v1'
// Caps unbounded growth (one entry per finished game, forever) so storage doesn't eventually hit
// quota on its own — oldest entries past this are dropped first, on save.
const MAX_HISTORY_ENTRIES = 200

export function listHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    // Older entries (saved before ties were tracked) have a singular `winnerName` string instead
    // of `winnerNames` — normalize them on read rather than rewriting storage.
    const parsed = JSON.parse(raw) as (HistoryEntry & { winnerName?: string })[]
    return parsed
      .map((e) => ({ ...e, winnerNames: e.winnerNames ?? (e.winnerName ? [e.winnerName] : []) }))
      .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
  } catch {
    return []
  }
}

// Saving a finished game must never throw: this runs synchronously inside the game reducer right
// when a player completes their table, with no error boundary anywhere to catch a crash there —
// a quota error (or any storage failure) would otherwise take down the app at that exact moment.
export function saveHistoryEntry(entry: HistoryEntry): void {
  try {
    const all = listHistory()
    all.unshift(entry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, MAX_HISTORY_ENTRIES)))
  } catch {
    // ignore storage failures (e.g. quota exceeded, private browsing) — the finished game still
    // shows on the end screen, it just won't be saved to history
  }
}

export function deleteHistoryEntry(id: string): void {
  try {
    const all = listHistory().filter((e) => e.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // ignore storage failures
  }
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  return listHistory().find((e) => e.id === id) ?? null
}
