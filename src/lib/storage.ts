import type { PlayerTable } from './types'

export interface HistoryEntry {
  id: string
  date: string // ISO timestamp
  players: { name: string; total: number }[]
  winnerName: string
  winnerScore: number
  tables: { name: string; table: PlayerTable }[]
}

const STORAGE_KEY = 'yamsbun.history.v1'

export function listHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryEntry[]
    return parsed.sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  const all = listHistory()
  all.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function deleteHistoryEntry(id: string): void {
  const all = listHistory().filter((e) => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  return listHistory().find((e) => e.id === id) ?? null
}
