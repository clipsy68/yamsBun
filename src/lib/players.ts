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

// Must never throw: called synchronously from the game reducer when a game finishes, with no
// error boundary anywhere to catch a crash there (e.g. on quota exceeded or private browsing).
function saveAll(players: SavedPlayer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
  } catch {
    // ignore storage failures — stats just won't update for this game
  }
}

/** Matches saved players whose name contains the query (case-insensitive), sorted by most games played. */
export function searchSavedPlayers(query: string): SavedPlayer[] {
  const q = normalize(query)
  if (!q) return []
  return listSavedPlayers()
    .filter((p) => normalize(p.name).includes(q))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
}

/** Records the result of a finished game: increments gamesPlayed for every player and gamesWon for
 * each winner — more than one name means a tie at the top score, and every tied player gets credit. */
export function recordGameResult(playerNames: string[], winnerNames: string[]): void {
  const all = listSavedPlayers()
  const winnerKeys = new Set(winnerNames.map(normalize))

  for (const name of playerNames) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const key = normalize(trimmed)
    const existing = all.find((p) => normalize(p.name) === key)
    if (existing) {
      existing.gamesPlayed += 1
      if (winnerKeys.has(key)) existing.gamesWon += 1
    } else {
      all.push({ name: trimmed, gamesPlayed: 1, gamesWon: winnerKeys.has(key) ? 1 : 0 })
    }
  }

  saveAll(all)
}
