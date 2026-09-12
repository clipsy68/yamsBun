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
