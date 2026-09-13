import { useEffect, useRef, useState } from 'react'
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

type PickerKey = 'count' | 'triple' | 'pair' | 'single'

export default function CellDialog({ column, row, existingCell, onConfirm, onCross, onClear, onCancel }: CellDialogProps) {
  const category = rowCategory(row)
  const canClear = existingCell.kind !== 'empty'
  const allowServit = column !== 'S'

  const [count, setCount] = useState<number | null>(existingCell.kind === 'upper' ? existingCell.count : null)
  const [servit, setServit] = useState(
    (existingCell.kind === 'fixed' || existingCell.kind === 'fullHouse' || existingCell.kind === 'fourKind' || existingCell.kind === 'yams') &&
      existingCell.servit,
  )
  const [tripleFace, setTripleFace] = useState<number | null>(existingCell.kind === 'fullHouse' ? existingCell.tripleFace : null)
  const [pairFace, setPairFace] = useState<number | null>(existingCell.kind === 'fullHouse' ? existingCell.pairFace : null)
  const [face, setFace] = useState<number | null>(
    existingCell.kind === 'fourKind' ? existingCell.face : existingCell.kind === 'yams' ? existingCell.face : null,
  )
  const [sum, setSum] = useState(existingCell.kind === 'chance' ? String(existingCell.sum) : '')
  const [activePicker, setActivePicker] = useState<PickerKey | null>(() => {
    if (category === 'upper' && count === null) return 'count'
    if ((category === 'fourKind' || category === 'yams') && face === null) return 'single'
    return null
  })
  const sumInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (category === 'chance') sumInputRef.current?.focus()
  }, [category])

  function buildCell(): Cell | null {
    switch (category) {
      case 'upper':
        return count === null ? null : { kind: 'upper', count }
      case 'fixed':
        return { kind: 'fixed', servit: allowServit && servit }
      case 'fullHouse':
        return tripleFace === null || pairFace === null
          ? null
          : { kind: 'fullHouse', tripleFace, pairFace, servit: allowServit && servit }
      case 'fourKind':
        return face === null ? null : { kind: 'fourKind', face, servit: allowServit && servit }
      case 'yams':
        return face === null ? null : { kind: 'yams', face, servit: allowServit && servit }
      case 'chance':
        return sum.trim() === '' ? null : { kind: 'chance', sum: Number(sum) || 0 }
    }
  }

  const previewCell = buildCell()
  const score = previewCell ? cellPoints(previewCell, row, column) : 0
  const canConfirm = previewCell !== null

  function handlePick(n: number) {
    switch (activePicker) {
      case 'count':
        setCount(n)
        break
      case 'triple':
        setTripleFace(n)
        break
      case 'pair':
        setPairFace(n)
        break
      case 'single':
        setFace(n)
        break
    }
    setActivePicker(null)
  }

  function handleOverlayClick() {
    if (activePicker) {
      setActivePicker(null)
      return
    }
    onCancel()
  }

  if (activePicker) {
    const isCount = activePicker === 'count'
    const options = isCount ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]
    const groupSub =
      activePicker === 'triple'
        ? 'pentru grupul de 3 · Full House'
        : activePicker === 'pair'
          ? 'pentru grupul de 2 · Full House'
          : activePicker === 'single' && category === 'fourKind'
            ? 'pentru grupul de 4 · Careu'
            : activePicker === 'single' && category === 'yams'
              ? 'pentru grupul de 5 · Yams'
              : `căsuța „${row}” · coloana ${COLUMN_LABELS[column]}`

    return (
      <div className="cd-overlay" onClick={handleOverlayClick}>
        <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cd-picker-title">{isCount ? 'Alege numărul de zaruri' : 'Alege fața zarului'}</div>
          <div className="cd-picker-sub">{groupSub}</div>
          <div className={isCount ? 'cd-picker-grid cd-picker-grid-5' : 'cd-picker-grid cd-picker-grid-6'}>
            {options.map((n) => (
              <button key={n} type="button" className="cd-picker-opt" onClick={() => handlePick(n)}>
                {isCount ? n : <DieFace face={n} size={24} pipColor="var(--navy)" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cd-overlay" onClick={handleOverlayClick}>
      <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cd-head">
          <div className="cd-die-icon">{row}</div>
          <div>
            <div className="cd-title">Completează căsuța „{row}”</div>
            <div className="cd-sub">Coloana {COLUMN_LABELS[column]}</div>
          </div>
        </div>

        {category === 'upper' && (
          <div className="cd-count-row">
            <button type="button" className={`cd-dice-slot cd-count-slot ${count !== null ? 'filled' : ''}`} onClick={() => setActivePicker('count')}>
              {count !== null ? count : 'select'}
            </button>
            <div className="cd-times">×</div>
            <div className="cd-face-static">
              <DieFace face={Number(row)} size={26} pipColor="var(--navy)" />
            </div>
          </div>
        )}

        {category === 'fixed' && (
          <div className="cd-dice-group">
            {(row === 'q' ? [1, 2, 3, 4, 5] : [2, 3, 4, 5, 6]).map((f, i) => (
              <div className="cd-dice-slot filled" key={i}>
                <DieFace face={f} size={24} pipColor="var(--navy)" />
              </div>
            ))}
          </div>
        )}

        {category === 'fullHouse' && (
          <>
            <DiceSlots n={3} value={tripleFace} onTap={() => setActivePicker('triple')} />
            <DiceSlots n={2} value={pairFace} onTap={() => setActivePicker('pair')} />
          </>
        )}
        {category === 'fourKind' && <DiceSlots n={4} value={face} onTap={() => setActivePicker('single')} />}
        {category === 'yams' && <DiceSlots n={5} value={face} onTap={() => setActivePicker('single')} />}

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
              ref={sumInputRef}
              autoFocus
              className="cd-number-input"
              type="number"
              inputMode="numeric"
              value={sum}
              onChange={(e) => setSum(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
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
              onClick={() => onConfirm(previewCell!)}
            >
              Confirmă
            </button>
          </div>
          {canClear && (
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

function DiceSlots({ n, value, onTap }: { n: number; value: number | null; onTap: () => void }) {
  return (
    <div className="cd-dice-group">
      {Array.from({ length: n }).map((_, i) => (
        <button type="button" key={i} className={`cd-dice-slot ${value !== null ? 'filled' : ''}`} onClick={onTap}>
          {value !== null ? <DieFace face={value} size={24} pipColor="var(--navy)" /> : 'select'}
        </button>
      ))}
    </div>
  )
}
