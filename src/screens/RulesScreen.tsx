import { useGame, type Screen } from '../state/GameContext'
import './RulesScreen.css'

interface RulesScreenProps {
  from: Screen
}

export default function RulesScreen({ from }: RulesScreenProps) {
  const { dispatch } = useGame()

  return (
    <div className="rs-screen">
      <div className="rs-topbar">
        <button className="rs-back-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: from })}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="rs-title">Regulile jocului</div>
      </div>

      <div className="rs-content">
        <section>
          <div className="rs-sec-title">Obiectiv</div>
          <p>
            Fiecare jucător are un tabel cu 5 coloane. Scopul e să completezi toate căsuțele fiecărei coloane,
            respectând regula ei de ordine, pentru cel mai mare scor total.
          </p>
        </section>

        <section>
          <div className="rs-sec-title">Cele 5 coloane</div>
          <div className="rs-col-grid">
            <div className="rs-col-chip">
              <div className="rs-sym">L</div>
              <div className="rs-desc">liberă, orice ordine</div>
            </div>
            <div className="rs-col-chip">
              <div className="rs-sym">↓</div>
              <div className="rs-desc">de sus în jos, în ordine</div>
            </div>
            <div className="rs-col-chip">
              <div className="rs-sym">↑</div>
              <div className="rs-desc">de jos în sus, în ordine</div>
            </div>
            <div className="rs-col-chip">
              <div className="rs-sym">↓↑</div>
              <div className="rs-desc">din mijloc spre capete</div>
            </div>
            <div className="rs-col-chip">
              <div className="rs-sym">S</div>
              <div className="rs-desc">servit — dublează scorul</div>
            </div>
          </div>
        </section>

        <section>
          <div className="rs-sec-title">Secțiunea 1–6</div>
          <p>
            Scor = nr. zaruri cu fața respectivă × valoarea feței. Dacă suma celor 6 rânduri ajunge la{' '}
            <b>63</b> (3 din fiecare), primești <b>bonus de 50</b>. Pe coloana S, totul (sumă + bonus) se
            dublează la final.
          </p>
          <div className="rs-card">
            <p>
              <b>Bancă live:</b> înainte ca o coloană să fie completă, căsuța „Tot” arată diferența față de
              ritmul normal (3 zaruri/rând) — verde dacă ești peste, roșu dacă ești sub. Totalul real apare
              doar când coloana e gata.
            </p>
          </div>
        </section>

        <section>
          <div className="rs-sec-title">Secțiunea inferioară</div>
          <table className="rs-formula">
            <tbody>
              <tr>
                <th>Cat.</th>
                <th>Formulă</th>
              </tr>
              <tr>
                <td className="rs-cat">q</td>
                <td>Chintă mică (1-2-3-4-5) — 35 puncte fix</td>
              </tr>
              <tr>
                <td className="rs-cat">Q</td>
                <td>Chintă mare (2-3-4-5-6) — 45 puncte fix</td>
              </tr>
              <tr>
                <td className="rs-cat">F</td>
                <td>Full House — suma celor 5 zaruri + 30</td>
              </tr>
              <tr>
                <td className="rs-cat">K</td>
                <td>Careu — suma celor 4 zaruri din careu + 40</td>
              </tr>
              <tr>
                <td className="rs-cat">Y</td>
                <td>Yams — suma celor 5 zaruri + 100</td>
              </tr>
              <tr>
                <td className="rs-cat">m</td>
                <td>Mici — suma zarurilor, mai mică decât M</td>
              </tr>
              <tr>
                <td className="rs-cat">M</td>
                <td>Mari — suma zarurilor, mai mare decât m</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <div className="rs-sec-title">Servit și bonusuri</div>
          <p>„Servit” înseamnă formația a ieșit din prima aruncare, fără nicio rearuncare.</p>
          <div className="rs-badge-row">
            <div className="rs-badge">Pe coloana S: scor × 2</div>
            <div className="rs-badge">În afara S: q/Q/F/K/Y + 10</div>
          </div>
        </section>
      </div>
    </div>
  )
}
