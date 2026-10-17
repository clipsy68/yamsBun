import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listSavedPlayers, recordGameResult } from '../players'

// vitest's default (node) environment has no localStorage — stand in a minimal in-memory version,
// with a `failing` flag to simulate a real browser's quota-exceeded (or private-browsing) errors.
class FakeLocalStorage implements Storage {
  private data = new Map<string, string>()
  failing = false

  get length() {
    return this.data.size
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    if (this.failing) throw new DOMException('Quota exceeded', 'QuotaExceededError')
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  clear() {
    this.data.clear()
  }
  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null
  }
}

let fakeStorage: FakeLocalStorage

beforeEach(() => {
  fakeStorage = new FakeLocalStorage()
  vi.stubGlobal('localStorage', fakeStorage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('recordGameResult', () => {
  it('increments gamesPlayed for everyone and gamesWon only for the winner', () => {
    recordGameResult(['Ana', 'Bogdan'], 'Ana')
    const all = listSavedPlayers()
    expect(all.find((p) => p.name === 'Ana')).toEqual({ name: 'Ana', gamesPlayed: 1, gamesWon: 1 })
    expect(all.find((p) => p.name === 'Bogdan')).toEqual({ name: 'Bogdan', gamesPlayed: 1, gamesWon: 0 })
  })

  it('never throws when storage writes fail (e.g. quota exceeded)', () => {
    fakeStorage.failing = true
    expect(() => recordGameResult(['Ana', 'Bogdan'], 'Ana')).not.toThrow()
  })
})
