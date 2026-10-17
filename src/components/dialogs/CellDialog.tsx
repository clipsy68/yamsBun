import { useEffect, useRef, useState } from 'react'
import DieFace from '../DieFace'
import { cellPoints } from '../../lib/scoring'
import {
  countFace,
  detectFourKind,
  detectFullHouse,
  detectLargeStraight,
  detectSmallStraight,
  detectYams,
  diceSum,
  type DiceState,
} from '../../lib/dice'
import { UPPER_ROWS, type Cell, type ColumnKey, type FillableRowKey } from '../../lib/types'
import { COLUMN_LABELS } from '../../lib/format'
import './CellDialog.css'

const CHANCE_MAX = 30
const CHANCE_MAX_SERVIT = 60

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
  /** Current dice, when playing with zaruri virtuale — used to auto-fill a fresh cell from the roll. */
  dice?: DiceState
  /** The other chance row's (m <-> M) sum in this same column, if set — enforces mici < mari. */
  siblingChanceSum?: number | null
  onConfirm: (cell: Cell) => void
  onCross: () => void
  onClear: () => void
  onCancel: () => void
}

type PickerKey = 'count' | 'triple' | 'pair' | 'single'

export default function CellDialog({
  column,
  row,
  existingCell,
  dice,
  siblingChanceSum,
  onConfirm,
  onCross,
  onClear,
  onCancel,
}: CellDialogProps) {
  const category = rowCategory(row)
  const canClear = existingCell.kind !== 'empty'
  const allowServit = column !== 'S'
  const chanceMax = column === 'S' ? CHANCE_MAX_SERVIT : CHANCE_MAX

  // A fresh (still-empty) cell gets auto-filled from the current dice roll when one matches the
  // row — e.g. tapping Careu with four 5s showing prefills face 5 directly. Editing an already-set
  // cell never auto-overwrites it.
  const isFresh = existingCell.kind === 'empty'

  // Playing with zaruri virtuale: "servit" (first-throw) status is only honest when the dice were
  // rolled exactly once this turn — a second or third roll means it can no longer be claimed on a
  // FRESH cell, either as the whole coloana Servit (column S) or as the +10 checkbox elsewhere.
  // Gated on isFresh: an already-confirmed cell's servit status was decided (and validated) at the
  // moment it was first saved, and re-rolling afterward (nothing stops that) must not retroactively
  // re-judge it — the checkbox is instead frozen (see servitDisabled) rather than re-evaluated live.
  const servitLocked = !!dice && isFresh && dice.rollsUsed > 1
  const columnSBlocked = column === 'S' && servitLocked
  // Editing an already-confirmed cell never lets the servit bonus be toggled at all — only a fresh
  // fill reacts to the current roll count.
  const servitDisabled = servitLocked || (!!dice && !isFresh)

  const autoFullHouse = isFresh && dice && category === 'fullHouse' ? detectFullHouse(dice) : null
  const autoFourKind = isFresh && dice && category === 'fourKind' ? detectFourKind(dice) : null
  const autoYams = isFresh && dice && category === 'yams' ? detectYams(dice) : null

  const [count, setCount] = useState<number | null>(() => {
    if (existingCell.kind === 'upper') return existingCell.count
    if (isFresh && dice && category === 'upper') return countFace(dice, Number(row))
    return null
  })
  const [servit, setServit] = useState(
    (existingCell.kind === 'fixed' || existingCell.kind === 'fullHouse' || existingCell.kind === 'fourKind' || existingCell.kind === 'yams') &&
      existingCell.servit,
  )
  const [tripleFace, setTripleFace] = useState<number | null>(
    existingCell.kind === 'fullHouse' ? existingCell.tripleFace : (autoFullHouse?.tripleFace ?? null),
  )
  const [pairFace, setPairFace] = useState<number | null>(
    existingCell.kind === 'fullHouse' ? existingCell.pairFace : (autoFullHouse?.pairFace ?? null),
  )
  const [face, setFace] = useState<number | null>(() => {
    if (existingCell.kind === 'fourKind' || existingCell.kind === 'yams') return existingCell.face
    return category === 'fourKind' ? autoFourKind : category === 'yams' ? autoYams : null
  })
  const [sum, setSum] = useState(() => {
    if (existingCell.kind === 'chance') return String(existingCell.sum)
    if (isFresh && dice && category === 'chance') {
      const base = diceSum(dice)
      return String(Math.min(column === 'S' ? base * 2 : base, chanceMax))
    }
    return ''
  })
  const [activePicker, setActivePicker] = useState<PickerKey | null>(() => {
    if (category === 'upper' && count === null) return 'count'
    if ((category === 'fourKind' || category === 'yams') && face === null) return 'single'
    return null
  })
  const sumInputRef = useRef<HTMLInputElement>(null)

  // Playing with zaruri virtuale: m/M is always exactly the roll's sum (doubled on S) — no free-form
  // entry, so there's nothing to type and no keyboard to open. A fresh cell reads the CURRENT roll;
  // an already-confirmed cell keeps showing its stored sum even if the dice were rolled again since
  // (rolling again doesn't change what was already saved — it must not silently recompute it either).
  // Only zaruri fizice (no `dice`) still needs the editable number input, since there's no roll to read.
  const diceChanceValue =
    dice && category === 'chance'
      ? isFresh
        ? Math.min(column === 'S' ? diceSum(dice) * 2 : diceSum(dice), chanceMax)
        : existingCell.kind === 'chance'
          ? existingCell.sum
          : 0
      : null

  useEffect(() => {
    if (category === 'chance' && diceChanceValue === null) sumInputRef.current?.focus()
  }, [category, diceChanceValue])

  const siblingLabel = row === 'm' ? 'Mari' : 'Mici'
  const chanceValue = diceChanceValue !== null ? diceChanceValue : sum.trim() !== '' ? Number(sum) : null
  const chanceRuleBroken =
    category === 'chance' &&
    siblingChanceSum != null &&
    chanceValue !== null &&
    (row === 'm' ? chanceValue >= siblingChanceSum : chanceValue <= siblingChanceSum)

  function buildCell(): Cell | null {
    switch (category) {
      case 'upper':
        return count === null ? null : { kind: 'upper', count }
      case 'fixed':
        return { kind: 'fixed', servit: allowServit && !servitLocked && servit }
      case 'fullHouse':
        return tripleFace === null || pairFace === null
          ? null
          : { kind: 'fullHouse', tripleFace, pairFace, servit: allowServit && !servitLocked && servit }
      case 'fourKind':
        return face === null ? null : { kind: 'fourKind', face, servit: allowServit && !servitLocked && servit }
      case 'yams':
        return face === null ? null : { kind: 'yams', face, servit: allowServit && !servitLocked && servit }
      case 'chance':
        if (diceChanceValue !== null) return { kind: 'chance', sum: diceChanceValue }
        return sum.trim() === '' ? null : { kind: 'chance', sum: Number(sum) || 0 }
    }
  }

  // Playing with zaruri virtuale: q/Q/F/K/Y can only be confirmed FRESH when the actual current roll
  // satisfies that combination — otherwise the dialog previously let a player cross-check nothing
  // and just confirm any pattern by hand (e.g. picking a Full House face pair that isn't on the
  // table). Chance (m/M) and upper rows have no dice-dependent requirement, so they're left alone.
  // Gated on isFresh: an already-confirmed cell's combination was already validated against the roll
  // that produced it — re-checking it against whatever the dice show NOW (they can keep being rolled
  // after a cell is filled) would falsely flag a valid save as invalid the moment the roll changes.
  const DICE_CRITERIA_LABEL: Record<Exclude<RowCategory, 'upper' | 'chance'>, string> = {
    fixed: row === 'q' ? 'Chintă mică' : 'Chintă mare',
    fullHouse: 'Full',
    fourKind: 'Careu',
    yams: 'Yams',
  }
  const diceCriteriaMet =
    !dice || category === 'upper' || category === 'chance' || !isFresh
      ? true
      : category === 'fixed'
        ? row === 'q'
          ? detectSmallStraight(dice)
          : detectLargeStraight(dice)
        : category === 'fullHouse'
          ? detectFullHouse(dice) !== null
          : category === 'fourKind'
            ? detectFourKind(dice) !== null
            : detectYams(dice) !== null

  const previewCell = buildCell()
  const score = previewCell ? cellPoints(previewCell, row, column) : 0
  const canConfirm = previewCell !== null && !chanceRuleBroken && diceCriteriaMet && !columnSBlocked

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

        {dice && isFresh && !diceCriteriaMet && category !== 'upper' && category !== 'chance' && (
          <div className="cd-warning">
            Nu puteți completa această căsuță deoarece nu îndepliniți criteriile pentru {DICE_CRITERIA_LABEL[category]}
          </div>
        )}

        {columnSBlocked && (
          <div className="cd-warning">
            Nu puteți completa coloana Servit deoarece ați aruncat zarurile de mai multe ori
          </div>
        )}

        {(category === 'fixed' || category === 'fullHouse' || category === 'fourKind' || category === 'yams') && allowServit && (
          <label className={`cd-servit-row ${servitDisabled ? 'cd-servit-row-disabled' : ''}`}>
            <button
              type="button"
              className={`cd-servit-check ${servit ? 'checked' : ''}`}
              onClick={() => !servitDisabled && setServit((v) => !v)}
              aria-pressed={servit}
              disabled={servitDisabled}
            />
            <div className="cd-servit-text">
              Servit{' '}
              <span>{servitLocked ? '(doar la prima aruncare)' : '(+10 puncte, prima aruncare)'}</span>
            </div>
          </label>
        )}

        {category === 'chance' && (
          <div className="cd-field">
            <div className="cd-label">Suma celor 5 zaruri</div>
            {diceChanceValue !== null ? (
              <div className="cd-number-input cd-number-static">{diceChanceValue}</div>
            ) : (
              <input
                ref={sumInputRef}
                autoFocus
                className="cd-number-input"
                type="number"
                inputMode="numeric"
                max={chanceMax}
                min={0}
                value={sum}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === '') {
                    setSum('')
                    return
                  }
                  const n = Number(raw)
                  if (Number.isNaN(n)) return
                  setSum(String(Math.max(0, Math.min(n, chanceMax))))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }
                }}
                placeholder="0"
              />
            )}
            {chanceRuleBroken && (
              <div className="cd-warning">
                {row === 'm' ? 'Mici' : 'Mari'} trebuie să fie {row === 'm' ? 'mai mic' : 'mai mare'} decât {siblingLabel} (
                {siblingChanceSum} p)
              </div>
            )}
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
