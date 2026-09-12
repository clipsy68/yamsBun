import { useEffect, useMemo, useRef, useState } from 'react'
import GeneralScoreTable from '../components/GeneralScoreTable'
import PdfViewer from '../components/PdfViewer'
import { nodeToPdfBytes } from '../lib/pdf'
import { getHistoryEntry } from '../lib/storage'
import { useGame } from '../state/GameContext'
import './GameEndScreen.css'
import './HistoryDetailScreen.css'

interface HistoryDetailScreenProps {
  id: string
}

export default function HistoryDetailScreen({ id }: HistoryDetailScreenProps) {
  const { dispatch } = useGame()
  const entry = useMemo(() => getHistoryEntry(id), [id])
  const captureRef = useRef<HTMLDivElement>(null)
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
  const [status, setStatus] = useState<'rendering' | 'ready' | 'error'>('rendering')

  useEffect(() => {
    if (!entry) return
    setStatus('rendering')
    setPdfBytes(null)
    let cancelled = false

    ;(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const node = captureRef.current
      if (!node) return
      try {
        const bytes = await nodeToPdfBytes(node)
        if (!cancelled) {
          setPdfBytes(bytes)
          setStatus('ready')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, entry])

  if (!entry) {
    return (
      <div className="ge-screen">
        <div className="ge-content">
          <div>Jocul nu a fost găsit.</div>
          <button className="ge-btn-history" onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'history' } })}>
            Înapoi la istoric
          </button>
        </div>
      </div>
    )
  }

  const players = entry.tables.map((t, i) => ({ id: `${i}-${t.name}`, name: t.name, table: t.table }))

  return (
    <div className="ge-screen">
      <div className="ge-topbar">
        <button
          className="ge-trophy"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: { name: 'history' } })}
          aria-label="Înapoi"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <div className="ge-t1">{new Date(entry.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div className="ge-t2">{entry.players.map((p) => p.name).join(', ')}</div>
        </div>
      </div>

      <div className="ge-content">
        {status !== 'ready' && (
          <div className="hd-status">
            {status === 'rendering' ? 'Se generează PDF-ul…' : 'Nu am putut genera PDF-ul acestui joc.'}
          </div>
        )}
        {status === 'ready' && pdfBytes && <PdfViewer data={pdfBytes} />}
      </div>

      {status === 'rendering' && (
        <div className="hd-capture-host">
          <div className="ge-page" ref={captureRef}>
            <GeneralScoreTable players={players} />

            <div className="ge-totals-row">
              {entry.players.map((p) => (
                <div className={`ge-totals-card ${p.name === entry.winnerName ? 'winner' : ''}`} key={p.name}>
                  <div className="ge-totals-name-row">
                    <div className="ge-totals-name">{p.name}</div>
                  </div>
                  <div className="ge-totals-score">{p.total} p</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
