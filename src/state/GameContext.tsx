import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { createEmptyTable, isTableComplete, playerGrandTotal } from '../lib/scoring'
import { freshDice, rollDice as rollDiceState, toggleHold as toggleHoldState, type DiceState } from '../lib/dice'
import { saveHistoryEntry, type HistoryEntry } from '../lib/storage'
import type { Cell, ColumnKey, FillableRowKey, GameSetup, Player } from '../lib/types'

export type Screen =
  | { name: 'start' }
  | { name: 'selectFirst' }
  | { name: 'player' }
  | { name: 'general' }
  | { name: 'end' }
  | { name: 'history' }
  | { name: 'historyDetail'; id: string }
  | { name: 'rules'; from: Screen }

interface State {
  screen: Screen
  players: Player[]
  activePlayerIndex: number
  gameType: 'fizic' | 'virtual'
  showLiveTotal: boolean
  dice: DiceState
  lastFinishedId: string | null
  turnFilledCell: { column: ColumnKey; row: FillableRowKey } | null
}

type Action =
  | { type: 'NAVIGATE'; screen: Screen }
  | { type: 'START_GAME'; setup: GameSetup }
  | { type: 'SELECT_FIRST_PLAYER'; index: number }
  | { type: 'SET_CELL'; playerIndex: number; column: ColumnKey; row: FillableRowKey; cell: Cell }
  | { type: 'NEXT_PLAYER' }
  | { type: 'ROLL_DICE' }
  | { type: 'TOGGLE_HOLD'; index: number }
  | { type: 'NEW_GAME' }

function makePlayers(setup: GameSetup): Player[] {
  return setup.names.map((name, i) => ({
    id: `p${i}-${Date.now()}`,
    name: name.trim(),
    table: createEmptyTable(),
  }))
}

const initialState: State = {
  screen: { name: 'start' },
  players: [],
  activePlayerIndex: 0,
  gameType: 'virtual',
  showLiveTotal: false,
  dice: freshDice(),
  lastFinishedId: null,
  turnFilledCell: null,
}

function finishGameIfComplete(state: State): State {
  if (!state.players.every((p) => isTableComplete(p.table))) return state
  const ranked = state.players
    .map((p) => ({ name: p.name, total: playerGrandTotal(p.table) }))
    .sort((a, b) => b.total - a.total)
  const entry: HistoryEntry = {
    id: `g${Date.now()}`,
    date: new Date().toISOString(),
    players: ranked,
    winnerName: ranked[0].name,
    winnerScore: ranked[0].total,
    tables: state.players.map((p) => ({ name: p.name, table: p.table })),
  }
  saveHistoryEntry(entry)
  return { ...state, screen: { name: 'end' }, lastFinishedId: entry.id }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, screen: action.screen }

    case 'START_GAME':
      return {
        ...state,
        players: makePlayers(action.setup),
        gameType: action.setup.gameType,
        showLiveTotal: action.setup.showLiveTotal,
        activePlayerIndex: 0,
        dice: freshDice(),
        screen: { name: 'selectFirst' },
        turnFilledCell: null,
      }

    case 'SELECT_FIRST_PLAYER':
      return {
        ...state,
        activePlayerIndex: action.index,
        screen: { name: 'player' },
        dice: freshDice(),
        turnFilledCell: null,
      }

    case 'SET_CELL': {
      const players = state.players.map((p, i) =>
        i !== action.playerIndex
          ? p
          : {
              ...p,
              table: {
                ...p.table,
                [action.column]: { ...p.table[action.column], [action.row]: action.cell },
              },
            },
      )
      const turnFilledCell = action.cell.kind === 'empty' ? null : { column: action.column, row: action.row }
      return { ...state, players, turnFilledCell }
    }

    case 'NEXT_PLAYER': {
      const next = (state.activePlayerIndex + 1) % state.players.length
      const advanced = { ...state, activePlayerIndex: next, dice: freshDice(), turnFilledCell: null }
      return finishGameIfComplete(advanced)
    }

    case 'ROLL_DICE':
      return { ...state, dice: rollDiceState(state.dice) }

    case 'TOGGLE_HOLD':
      return { ...state, dice: toggleHoldState(state.dice, action.index) }

    case 'NEW_GAME':
      return { ...initialState, dice: freshDice() }

    default:
      return state
  }
}

interface GameContextValue extends State {
  dispatch: React.Dispatch<Action>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <GameContext.Provider value={{ ...state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
