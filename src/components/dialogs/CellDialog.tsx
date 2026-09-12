import { useState } from 'react'
import DieFace from '../DieFace'
import { cellPoints } from '../../lib/scoring'
import { UPPER_ROWS, type Cell, type ColumnKey, type FillableRowKey } from '../../lib/types'
import { COLUMN_LABELS } from '../../lib/format'
import './CellDialog.css'

type RowCategory = 'upper' | 'fixed' | 'fullHouse' | 'fourKind' | 'yams' | 'chance'

function rowCategory(row: FillableRowKey): RowCategory {
  if ((UPPER_ROWS as readonly string[]).includes(row)) return 'upper'
  if (row === 'q' || row === 'Q') return 'fixed'
  if (row === 'F') return 'fullHouse'
  if (row === 'K') return 'fourKind'
  if (row === 'Y') return 'yams'
  return 'chance'
}

interface CellDialogProps {
  column: ColumnKey
  row: FillableRowKey
  existingCell: Cell
  onConfirm: (cell: Cell) => void
  onCross: () => void
  onClear: () => void
  onCancel: () => void
}

const FACES = [1, 2, 3, 4, 5, 6]

export default function CellDialog({ column, row, existingCell, onConfirm, onCross, onClear, onCancel }: CellDialogProps) {
  const category = rowCategory(row)
  const isFilled = existingCell.kind !== 'empty' && existingCell.kind !== 'crossed'
  const allowServit = column !== 'S'

  const [count, setCount] = useState(existingCell.kind === 'upper' ? existingCell.count : 0)
  const [servit, setServit] = useState(
    (existingCell.kind === 'fixed' || existingCell.kind === 'fullHouse' || existingCell.kind === 'fourKind' || existingCell.kind === 'yams') &&
      existingCell.servit,
  )
  const [tripleFace, setTripleFace] = useState(existingCell.kind === 'fullHouse' ? existingCell.tripleFace : 6)
  const [pairFace, setPairFace] = useState(existingCell.kind === 'fullHouse' ? existingCell.pairFace : 1)
  const [face, setFace] = useState(
    existingCell.kind === 'fourKind' ? existingCell.face : existingCell.kind === 'yams' ? existingCell.face : 6,
  )
  const [sum, setSum] = useState(existingCell.kind === 'chance' ? String(existingCell.sum) : '')

  function buildCell(): Cell {
    switch (category) {
      case 'upper':
        return { kind: 'upper', count }
      case 'fixed':
        return { kind: 'fixed', servit: allowServit && servit }
      case 'fullHouse':
        return { kind: 'fullHouse', tripleFace, pairFace, servit: allowServit && servit }
      case 'fourKind':
        return { kind: 'fourKind', face, servit: allowServit && servit }
      case 'yams':
        return { kind: 'yams', face, servit: allowServit && servit }
      case 'chance':
        return { kind: 'chance', sum: Number(sum) || 0 }
    }
  }

  const previewCell = buildCell()
  const score = cellPoints(previewCell, row, column)
  const canConfirm = category !== 'chance' || sum.trim().length > 0

  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cd-head">
          <div className="cd-die-icon">{row}</div>
          <div>
            <div className="cd-title">Completează căsuța „{row}”</div>
            <div className="cd-sub">Coloana {COLUMN_LABELS[column]}</div>
          </div>
        </div>

        {category === 'upper' && (
          <div className="cd-field">
            <div className="cd-label">Câte zaruri au ieșit cu fața {row}</div>
            <div className="cd-count-row">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`cd-count-chip ${n === count ? 'selected' : ''}`}
                  onClick={() => setCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {category === 'fixed' && (
          <div className="cd-field">
            <div className="cd-dice-group">
              {(row === 'q' ? [1, 2, 3, 4, 5] : [2, 3, 4, 5, 6]).map((f, i) => (
                <div className="cd-die-slot filled" key={i}>
                  <DieFace face={f} size={24} pipColor="var(--navy)" />
                </div>
              ))}
            </div>
          </div>
        )}

        {(category === 'fullHouse' || category === 'fourKind' || category === 'yams') && (
          <FacePicker
            label={category === 'fullHouse' ? 'Careu (3 zaruri)' : category === 'fourKind' ? 'Careu (4 zaruri)' : 'Yams (5 zaruri)'}
            value={category === 'fullHouse' ? tripleFace : face}
            onChange={category === 'fullHouse' ? setTripleFace : setFace}
          />
        )}
        {category === 'fullHouse' && <FacePicker label="Pereche (2 zaruri)" value={pairFace} onChange={setPairFace} />}

        {(category === 'fixed' || category === 'fullHouse' || category === 'fourKind' || category === 'yams') && allowServit && (
          <label className="cd-servit-row">
            <button
              type="button"
              className={`cd-servit-check ${servit ? 'checked' : ''}`}
              onClick={() => setServit((v) => !v)}
              aria-pressed={servit}
            />
            <div className="cd-servit-text">
              Servit <span>(+10 puncte, prima aruncare)</span>
            </div>
          </label>
        )}

        {category === 'chance' && (
          <div className="cd-field">
            <div className="cd-label">Suma celor 5 zaruri</div>
            <input
              className="cd-number-input"
              type="number"
              inputMode="numeric"
              value={sum}
              onChange={(e) => setSum(e.target.value)}
              placeholder="0"
            />
          </div>
        )}

        <div className="cd-score-line">
          <div className="cd-score-value">{canConfirm ? score : '—'}</div>
        </div>

        <div className="cd-actions">
          <div className="cd-btn-row">
            <button type="button" className="cd-btn cd-btn-taie" onClick={onCross}>
              Taie
            </button>
            <button
              type="button"
              className="cd-btn cd-btn-confirm"
              disabled={!canConfirm}
              onClick={() => onConfirm(previewCell)}
            >
              Confirmă
            </button>
          </div>
          {isFilled && (
            <button type="button" className="cd-btn cd-btn-clear" onClick={onClear}>
              Golește căsuța
            </button>
          )}
          <button type="button" className="cd-btn cd-btn-cancel" onClick={onCancel}>
            Anulează
          </button>
        </div>
      </div>
    </div>
  )
}

function FacePicker({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="cd-field">
      <div className="cd-label">{label}</div>
      <div className="cd-face-row">
        {FACES.map((f) => (
          <button
            key={f}
            type="button"
            className={`cd-face-chip ${f === value ? 'selected' : ''}`}
            onClick={() => onChange(f)}
          >
            <DieFace face={f} size={22} pipColor={f === value ? 'var(--navy)' : 'var(--ink-soft)'} />
          </button>
        ))}
      </div>
    </div>
  )
}
