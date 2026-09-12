import GeneralScoreTable from '../components/GeneralScoreTable'
import { useGame } from '../state/GameContext'
import './GeneralTableScreen.css'

export default function GeneralTableScreen() {
  const { players, activePlayerIndex, dispatch } = useGame()
  const active = players[activePlayerIndex]

  return (
    <div className="gts-screen">
      <div className="gts-topbar">
        <button className="gts-back-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'player' } })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Înapoi
        </button>
        <div className="gts-title">Tabel general</div>
      </div>

      <div className="gts-table-wrap">
        <GeneralScoreTable players={players} highlightStyle="turn" highlightedId={active?.id} />
      </div>
    </div>
  )
}
