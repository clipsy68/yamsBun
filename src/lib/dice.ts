export interface DiceState {
  faces: number[] // 5 values, 1-6
  held: boolean[] // 5 flags
  rollsUsed: number // 0-3
}

export function rollFace(): number {
  return 1 + Math.floor(Math.random() * 6)
}

export function freshDice(): DiceState {
  return { faces: [1, 1, 1, 1, 1], held: [false, false, false, false, false], rollsUsed: 0 }
}

/** Rolls the non-held dice; the first roll (rollsUsed === 0) always rolls all five. */
export function rollDice(state: DiceState): DiceState {
  if (state.rollsUsed >= 3) return state
  const faces = state.faces.map((face, i) => (state.rollsUsed === 0 || !state.held[i] ? rollFace() : face))
  return { ...state, faces, rollsUsed: state.rollsUsed + 1 }
}

export function toggleHold(state: DiceState, index: number): DiceState {
  if (state.rollsUsed === 0) return state // nothing to hold before the first roll
  const held = state.held.map((h, i) => (i === index ? !h : h))
  return { ...state, held }
}

/** How many of the current dice show a given face — used to prefill the upper-row count picker. */
export function countFace(state: DiceState, face: number): number {
  return state.faces.filter((f) => f === face).length
}

/** Sum of all 5 dice — used to prefill the m/M (chance) sum. */
export function diceSum(state: DiceState): number {
  return state.faces.reduce((a, b) => a + b, 0)
}

function faceCounts(state: DiceState): Map<number, number> {
  const counts = new Map<number, number>()
  for (const f of state.faces) counts.set(f, (counts.get(f) ?? 0) + 1)
  return counts
}

/** Detects a full house (exactly 3 of one face + 2 of another) in the current dice, if present. */
export function detectFullHouse(state: DiceState): { tripleFace: number; pairFace: number } | null {
  const counts = faceCounts(state)
  let tripleFace: number | null = null
  let pairFace: number | null = null
  for (const [face, count] of counts) {
    if (count === 3) tripleFace = face
    if (count === 2) pairFace = face
  }
  return tripleFace !== null && pairFace !== null ? { tripleFace, pairFace } : null
}

/** Detects a face with at least 4 of a kind in the current dice, if present. */
export function detectFourKind(state: DiceState): number | null {
  for (const [face, count] of faceCounts(state)) {
    if (count >= 4) return face
  }
  return null
}

/** Detects a face with all 5 dice matching (Yams) in the current dice, if present. */
export function detectYams(state: DiceState): number | null {
  for (const [face, count] of faceCounts(state)) {
    if (count === 5) return face
  }
  return null
}

/** True when the 5 dice are exactly the faces 1-2-3-4-5 (chintă mică). */
export function detectSmallStraight(state: DiceState): boolean {
  const faces = new Set(state.faces)
  return [1, 2, 3, 4, 5].every((f) => faces.has(f))
}

/** True when the 5 dice are exactly the faces 2-3-4-5-6 (chintă mare). */
export function detectLargeStraight(state: DiceState): boolean {
  const faces = new Set(state.faces)
  return [2, 3, 4, 5, 6].every((f) => faces.has(f))
}
