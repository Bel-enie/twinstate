import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import Panel from '../ui/Panel.jsx'
import { useTwin } from '../../context/TwinContext.jsx'
import { holon } from '../../services/index.js'

/**
 * "Log a dose taken today" — makes the twin living rather than a one-off.
 * You can queue several substances and log them all at once; logging updates
 * History + the current pattern and recomputes risk, so the 3D body, What-If
 * and Next-step all move in sync.
 */
export default function LogDose() {
  const { items, logDoses } = useTwin()
  const [catalog, setCatalog] = useState([])
  const [substanceId, setSubstanceId] = useState('')
  const [dose, setDose] = useState('')
  const [queue, setQueue] = useState([]) // [{ substanceId, dose, label, unit, def? }]
  const [flash, setFlash] = useState(null)
  const [customName, setCustomName] = useState('')
  const [resolving, setResolving] = useState(false)
  const flashTimer = useRef(null)

  useEffect(() => {
    holon.getCatalog().then(setCatalog).catch(() => setCatalog([]))
  }, [])

  // The confirmation timer is cleared on unmount and whenever a newer log
  // replaces it, so an older timer can never cut a newer message short.
  useEffect(() => () => clearTimeout(flashTimer.current), [])

  // Show the student's own substances first, then the rest of the catalog.
  const options = useMemo(() => {
    if (!catalog.length) return []
    const mine = new Set(items.map((i) => i.substanceId))
    const first = catalog.filter((c) => mine.has(c.id))
    const rest = catalog.filter((c) => !mine.has(c.id))
    return [...first, ...rest]
  }, [catalog, items])

  // Default selection + dose prefill.
  useEffect(() => {
    if (!substanceId && options.length) setSubstanceId(options[0].id)
  }, [options, substanceId])

  const selected = options.find((c) => c.id === substanceId)
  useEffect(() => {
    if (selected) setDose(String(selected.typicalDose ?? 1))
  }, [substanceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const addToQueue = () => {
    if (!selected) return
    setQueue((q) => [
      ...q,
      {
        substanceId,
        dose: Number(dose) > 0 ? Number(dose) : selected.typicalDose ?? 1,
        label: selected.label.split(' (')[0],
        unit: selected.unit || '',
      },
    ])
  }

  // Stage a substance the catalog doesn't know — resolve it via HOLON → AI → generic.
  const addCustom = async () => {
    const name = customName.trim()
    if (!name || resolving) return
    setResolving(true)
    try {
      const r = await holon.resolveSubstance(name)
      if (r?.def) {
        setQueue((q) => [
          ...q,
          {
            substanceId: r.def.id,
            dose: r.def.typicalDose ?? 1,
            label: r.def.label.split(' (')[0],
            unit: r.def.unit || '',
            def: r.def, // carry the resolved definition so it flows into analysis
          },
        ])
        setCustomName('')
      }
    } catch {
      /* resolution failed: leave the name in the box so they can retry */
    } finally {
      setResolving(false)
    }
  }

  const removeFromQueue = (i) => setQueue((q) => q.filter((_, idx) => idx !== i))

  const logAll = () => {
    // Nothing staged yet? Treat the current picker row as a single quick-log.
    const toLog = queue.length
      ? queue
      : selected
        ? [{ substanceId, dose: Number(dose) > 0 ? Number(dose) : selected.typicalDose ?? 1 }]
        : []
    if (!toLog.length) return

    const res = logDoses(toLog)
    if (res?.length) {
      const summary =
        res.length === 1
          ? `Logged ${res[0].name}: ${res[0].todayTimes}× today.`
          : `Logged ${res.length} doses: ${res.map((r) => r.name).join(', ')}.`
      setFlash(`${summary} Twin updated.`)
      setQueue([])
      clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlash(null), 3500)
    }
  }

  const count = queue.length

  return (
    <Panel eyebrow="Local recorder" title="Log a dose taken today">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[9rem] flex-1">
          <span className="mb-1 block text-[11px] font-semibold text-slate-soft">Substance</span>
          <select
            value={substanceId}
            onChange={(e) => setSubstanceId(e.target.value)}
            className="input-glass w-full rounded-xl px-3 py-2 text-sm outline-none"
          >
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label.split(' (')[0]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-[11px] font-semibold text-slate-soft">Dose</span>
          <div className="card-inset flex items-center gap-1 rounded-xl px-2 py-2">
            <input
              type="number"
              min="0"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              aria-label={`Dose${selected ? ` for ${selected.label.split(' (')[0]}` : ''}`}
              className="w-16 bg-transparent text-sm outline-none"
            />
            <span className="text-xs text-slate-soft">{selected?.unit || ''}</span>
          </div>
        </label>

        <button
          onClick={addToQueue}
          disabled={!selected}
          className="btn-outline inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
        </button>

        <button
          onClick={logAll}
          disabled={!selected && !count}
          className="btn-solid rounded-full px-4 py-2 text-sm font-semibold transition"
        >
          {count ? `Log ${count} dose${count > 1 ? 's' : ''}` : 'Log dose'}
        </button>
      </div>

      {/* Not in the list? Add anything by name (resolved via HOLON → AI). */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor="log-custom" className="text-[11px] text-slate-soft">
          Not listed?
        </label>
        <input
          id="log-custom"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Type any substance…"
          className="input-glass min-w-[8rem] flex-1 rounded-full px-3.5 py-1.5 text-sm outline-none"
        />
        <button
          onClick={addCustom}
          disabled={!customName.trim() || resolving}
          aria-label="Add the typed substance"
          className="inline-flex items-center gap-1.5 rounded-full border border-violet-300 px-3.5 py-1.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-40"
        >
          {resolving ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add custom
            </>
          )}
        </button>
      </div>

      {/* Staged doses waiting to be logged together */}
      {count > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {queue.map((q, i) => (
            <span
              key={`${q.substanceId}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-900"
            >
              {q.label}
              <span className="text-slate-soft">
                {q.dose}
                {q.unit}
              </span>
              <button
                onClick={() => removeFromQueue(i)}
                aria-label={`Remove ${q.label}`}
                className="ml-0.5 text-slate-soft transition hover:text-ink"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {flash && (
        <p
          role="status"
          aria-live="polite"
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" /> {flash}
        </p>
      )}
    </Panel>
  )
}
