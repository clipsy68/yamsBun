import { useState } from 'react'
import GeneralScoreTable from '../components/GeneralScoreTable'
import { useGame } from '../state/GameContext'
import './GeneralTableScreen.css'
import './SelectFirstPlayerScreen.css'

export default function SelectFirstPlayerScreen() {
  const { players, dispatch } = useGame()
  const [selectedId, setSelectedId] = useState(players[0]?.id)
  const selected = players.find((p) => p.id === selectedId) ?? players[0]

  return (
    <div className="gts-screen">
      <div>
        <div className="gts-title">Alege primul jucător</div>
        <div className="sfp-subtitle">Atinge tabelul unui jucător pentru a-l alege să înceapă runda</div>
      </div>

      <div className="gts-table-wrap">
        <GeneralScoreTable
          players={players}
          highlightStyle="select"
          highlightedId={selectedId}
          onSelectPlayer={setSelectedId}
        />
      </div>

      <button
        className="sfp-start-btn"
        onClick={() => dispatch({ type: 'SELECT_FIRST_PLAYER', index: players.findIndex((p) => p.id === selectedId) })}
      >
        Începe runda cu {selected?.name}
      </button>
    </div>
  )
}
