import { describe, expect, it } from 'vitest'
import {
  countFace,
  detectFourKind,
  detectFullHouse,
  detectLargeStraight,
  detectSmallStraight,
  detectYams,
  diceSum,
  freshDice,
  type DiceState,
} from '../dice'

function withFaces(faces: number[]): DiceState {
  return { ...freshDice(), faces, rollsUsed: 1 }
}

describe('diceSum', () => {
  it('sums all 5 dice', () => {
    expect(diceSum(withFaces([6, 6, 6, 5, 5]))).toBe(28)
  })
})

describe('countFace', () => {
  it('counts how many dice show a given face', () => {
    expect(countFace(withFaces([4, 4, 1, 2, 3]), 4)).toBe(2)
    expect(countFace(withFaces([4, 4, 1, 2, 3]), 6)).toBe(0)
  })
})

describe('detectFullHouse', () => {
  it('detects a 3+2 split', () => {
    expect(detectFullHouse(withFaces([6, 6, 6, 5, 5]))).toEqual({ tripleFace: 6, pairFace: 5 })
  })

  it('returns null when the dice are not a 3+2 split', () => {
    expect(detectFullHouse(withFaces([6, 6, 6, 6, 5]))).toBeNull() // four of a kind, not full house
    expect(detectFullHouse(withFaces([1, 2, 3, 4, 5]))).toBeNull()
  })
})

describe('detectFourKind', () => {
  it('detects a face with 4 or more matching dice', () => {
    expect(detectFourKind(withFaces([5, 5, 5, 5, 2]))).toBe(5)
    expect(detectFourKind(withFaces([3, 3, 3, 3, 3]))).toBe(3) // yams also counts as four of a kind
  })

  it('returns null with fewer than 4 matching', () => {
    expect(detectFourKind(withFaces([6, 6, 6, 5, 5]))).toBeNull()
  })
})

describe('detectYams', () => {
  it('detects all 5 dice matching', () => {
    expect(detectYams(withFaces([2, 2, 2, 2, 2]))).toBe(2)
  })

  it('returns null otherwise', () => {
    expect(detectYams(withFaces([2, 2, 2, 2, 3]))).toBeNull()
  })
})

describe('detectSmallStraight', () => {
  it('detects 1-2-3-4-5 in any order', () => {
    expect(detectSmallStraight(withFaces([3, 1, 5, 2, 4]))).toBe(true)
  })

  it('returns false otherwise', () => {
    expect(detectSmallStraight(withFaces([2, 3, 4, 5, 6]))).toBe(false)
    expect(detectSmallStraight(withFaces([1, 1, 3, 4, 5]))).toBe(false)
  })
})

describe('detectLargeStraight', () => {
  it('detects 2-3-4-5-6 in any order', () => {
    expect(detectLargeStraight(withFaces([6, 4, 2, 5, 3]))).toBe(true)
  })

  it('returns false otherwise', () => {
    expect(detectLargeStraight(withFaces([1, 2, 3, 4, 5]))).toBe(false)
    expect(detectLargeStraight(withFaces([2, 2, 4, 5, 6]))).toBe(false)
  })
})
