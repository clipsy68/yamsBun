export interface SavedPlayer {
  name: string
  gamesPlayed: number
  gamesWon: number
}

const STORAGE_KEY = 'yamsbun.players.v1'

function normalize(name: string): string {
  return name.trim().toLowerCase()
}

export function listSavedPlayers(): SavedPlayer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedPlayer[]
  } catch {
    return []
  }
}

function saveAll(players: SavedPlayer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
}

/** Matches saved players whose name contains the query (case-insensitive), sorted by most games played. */
export function searchSavedPlayers(query: string): SavedPlayer[] {
  const q = normalize(query)
  if (!q) return []
  return listSavedPlayers()
    .filter((p) => normalize(p.name).includes(q))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
}

/** Records the result of a finished game: increments gamesPlayed for every player and gamesWon for the winner. */
export function recordGameResult(playerNames: string[], winnerName: string): void {
  const all = listSavedPlayers()
  const winnerKey = normalize(winnerName)

  for (const name of playerNames) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const key = normalize(trimmed)
    const existing = all.find((p) => normalize(p.name) === key)
    if (existing) {
      existing.gamesPlayed += 1
      if (key === winnerKey) existing.gamesWon += 1
    } else {
      all.push({ name: trimmed, gamesPlayed: 1, gamesWon: key === winnerKey ? 1 : 0 })
    }
  }

  saveAll(all)
}
