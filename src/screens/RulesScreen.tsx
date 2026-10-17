import { Trans, useTranslation } from 'react-i18next'
import { useGame, type Screen } from '../state/GameContext'
import './RulesScreen.css'

interface RulesScreenProps {
  from: Screen
}

export default function RulesScreen({ from }: RulesScreenProps) {
  const { t } = useTranslation()
  const { dispatch } = useGame()

  return (
    <div className="rs-screen">
      <div className="rs-topbar">
        <button className="rs-back-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: from })}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="rs-title">{t('rules.title')}</div>
      </div>

      <div className="rs-content">
        <section>
          <div className="rs-sec-title">{t('rules.objectiveTitle')}</div>
          <p>{t('rules.objectiveBody')}</p>
        </section>

        <section>
          <div className="rs-sec-title">{t('rules.columnsTitle')}</div>
          <div className="rs-col-grid">
            <div className="rs-col-chip">
              <div className="rs-sym">L</div>
              <div className="rs-desc">{t('rules.colFreeDesc')}</div>
            </div>
            <div className="rs-col-chip">
              <div className="rs-sym">↓</div>
              <div className="rs-desc">{t('rules.colDownDesc')}</div>
            </div>
            <div className="rs-col-chip">
              <div className="rs-sym">↑</div>
              <div className="rs-desc">{t('rules.colUpDesc')}</div>
            </div>
            <div className="rs-col-chip">
              <div className="rs-sym">↓↑</div>
              <div className="rs-desc">{t('rules.colMiddleDesc')}</div>
            </div>
            <div className="rs-col-chip">
              <div className="rs-sym">S</div>
              <div className="rs-desc">{t('rules.colServedDesc')}</div>
            </div>
          </div>
        </section>

        <section>
          <div className="rs-sec-title">{t('rules.upperSectionTitle')}</div>
          <p>
            <Trans i18nKey="rules.upperSectionBody" components={{ bold: <b /> }} />
          </p>
          <div className="rs-card">
            <p>
              <b>{t('rules.bankLabel')}</b> {t('rules.bankBody')}
            </p>
          </div>
        </section>

        <section>
          <div className="rs-sec-title">{t('rules.lowerSectionTitle')}</div>
          <table className="rs-formula">
            <tbody>
              <tr>
                <th>{t('rules.colHeaderCat')}</th>
                <th>{t('rules.colHeaderFormula')}</th>
              </tr>
              <tr>
                <td className="rs-cat">q</td>
                <td>{t('rules.catSmallStraight')}</td>
              </tr>
              <tr>
                <td className="rs-cat">Q</td>
                <td>{t('rules.catLargeStraight')}</td>
              </tr>
              <tr>
                <td className="rs-cat">F</td>
                <td>{t('rules.catFullHouse')}</td>
              </tr>
              <tr>
                <td className="rs-cat">K</td>
                <td>{t('rules.catFourKind')}</td>
              </tr>
              <tr>
                <td className="rs-cat">Y</td>
                <td>{t('rules.catYams')}</td>
              </tr>
              <tr>
                <td className="rs-cat">m</td>
                <td>{t('rules.catLow')}</td>
              </tr>
              <tr>
                <td className="rs-cat">M</td>
                <td>{t('rules.catHigh')}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <div className="rs-sec-title">{t('rules.servedTitle')}</div>
          <p>{t('rules.servedBody')}</p>
          <div className="rs-badge-row">
            <div className="rs-badge">{t('rules.servedBadgeColumnS')}</div>
            <div className="rs-badge">{t('rules.servedBadgeOutsideS')}</div>
          </div>
        </section>
      </div>
    </div>
  )
}
