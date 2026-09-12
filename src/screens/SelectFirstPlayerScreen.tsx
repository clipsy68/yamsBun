import { useState } from 'react'
import ScoreTable from '../components/ScoreTable'
import { useGame } from '../state/GameContext'
import './GeneralTableScreen.css'
import './SelectFirstPlayerScreen.css'

export default function SelectFirstPlayerScreen() {
  const { players, dispatch } = useGame()
  const [selected, setSelected] = useState(0)

  return (
    <div className="gts-screen">
      <div>
        <div className="gts-title">Alege primul jucător</div>
        <div className="sfp-subtitle">Atinge tabelul unui jucător pentru a-l alege să înceapă runda</div>
      </div>

      <div className="gts-players-row">
        {players.map((p, i) => (
          <button
            type="button"
            className={`sfp-player-col ${i === selected ? 'selected' : ''}`}
            key={p.id}
            onClick={() => setSelected(i)}
          >
            <div className={`gts-player-name ${i === selected ? 'active' : ''}`}>
              {i === selected ? '✓ ' : ''}
              {p.name}
            </div>
            <ScoreTable table={p.table} />
          </button>
        ))}
      </div>

      <button className="sfp-start-btn" onClick={() => dispatch({ type: 'SELECT_FIRST_PLAYER', index: selected })}>
        Începe runda cu {players[selected]?.name}
      </button>
    </div>
  )
}
