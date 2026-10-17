import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteHistoryEntry, listHistory, saveHistoryEntry, type HistoryEntry } from '../storage'
import { createEmptyTable } from '../scoring'

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

function makeEntry(id: string): HistoryEntry {
  return {
    id,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    players: [{ name: 'Ana', total: 100 }],
    winnerName: 'Ana',
    winnerScore: 100,
    tables: [{ name: 'Ana', table: createEmptyTable() }],
  }
}

describe('saveHistoryEntry', () => {
  it('persists a new entry at the front', () => {
    saveHistoryEntry(makeEntry('a'))
    saveHistoryEntry(makeEntry('b'))
    expect(listHistory().map((e) => e.id)).toEqual(['b', 'a'])
  })

  it('never throws when storage writes fail (e.g. quota exceeded)', () => {
    fakeStorage.failing = true
    expect(() => saveHistoryEntry(makeEntry('x'))).not.toThrow()
  })

  it('caps history at 200 entries, dropping the oldest', () => {
    for (let i = 0; i < 205; i++) saveHistoryEntry(makeEntry(`e${i}`))
    const all = listHistory()
    expect(all.length).toBe(200)
    expect(all.map((e) => e.id)).toContain('e204') // newest kept
    expect(all.map((e) => e.id)).not.toContain('e0') // oldest dropped
  })
})

describe('deleteHistoryEntry', () => {
  it('removes the matching entry', () => {
    saveHistoryEntry(makeEntry('a'))
    saveHistoryEntry(makeEntry('b'))
    deleteHistoryEntry('a')
    expect(listHistory().map((e) => e.id)).toEqual(['b'])
  })

  it('never throws when storage writes fail', () => {
    saveHistoryEntry(makeEntry('a'))
    fakeStorage.failing = true
    expect(() => deleteHistoryEntry('a')).not.toThrow()
  })
})
