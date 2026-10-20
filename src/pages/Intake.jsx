import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import AppShell from '../components/layout/AppShell.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { holon } from '../services/index.js'
import { SYMPTOMS } from '../services/mock/mockData.js'
import { CATEGORY_LABEL } from '../utils/risk.js'

const FREQS = ['x1/day', 'x2/day', 'x3/day', 'x4+/day']

const TOGGLE_ON = 'bg-brand-grad text-white shadow-card'
const TOGGLE_OFF =
  'border border-ink/10 bg-white text-slate-soft hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700'

export default function Intake() {
  const navigate = useNavigate()
  const { buildTwin, status, error } = useTwin()

  const [catalog, setCatalog] = useState([])
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([]) // { substanceId, label, unit, dose, frequency }
  const [symptoms, setSymptoms] = useState([])
  const [notes, setNotes] = useState('')
  const [sleep, setSleep] = useState(6)
  const [stress, setStress] = useState('medium')
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    holon.getCatalog().then(setCatalog).catch(() => setCatalog([]))
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const chosen = new Set(items.map((i) => i.substanceId))
    return catalog
      .filter((c) => !chosen.has(c.id))
      .filter(
        (c) =>
          !q ||
          c.label.toLowerCase().includes(q) ||
          (c.aliases || []).some((a) => a.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [query, catalog, items])

  const addItem = (c) => {
    setItems((prev) => [
      ...prev,
      { substanceId: c.id, label: c.label, unit: c.unit, dose: c.typicalDose, frequency: 'x1/day' },
    ])
    setQuery('')
  }

  // Add something the catalog doesn't know — resolve it via HOLON → AI → generic.
  const addCustom = async () => {
    const name = query.trim()
    if (!name || resolving) return
    setResolving(true)
    try {
      const r = await holon.resolveSubstance(name)
      if (r?.def && !items.some((i) => i.substanceId === r.def.id)) {
        setItems((prev) => [
          ...prev,
          {
            substanceId: r.def.id,
            label: r.def.label,
            unit: r.def.unit,
            dose: r.def.typicalDose,
            frequency: 'x1/day',
            def: r.def, // carry the resolved definition so it flows into analysis
            source: r.source,
          },
        ])
        setQuery('')
      }
    } catch {
      /* resolution failed: keep the query so they can retry or pick a suggestion */
    } finally {
      setResolving(false)
    }
  }

  // Enter in the search box picks the top suggestion (or adds the typed name)
  // instead of submitting the whole form, which used to build the twin with
  // the substance silently missing.
  const onSearchKey = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (results.length) addItem(results[0])
    else if (query.trim()) addCustom()
  }

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.substanceId !== id))
  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((i) => (i.substanceId === id ? { ...i, ...patch } : i)))

  const toggleSymptom = (id) =>
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))

  const canSubmit = items.length > 0 && status !== 'building'

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    const ok = await buildTwin({
      name: 'You',
      profile: { sleepHours: sleep, stress },
      items: items.map(({ substanceId, dose, frequency, def }) => ({
        substanceId,
        dose,
        frequency,
        ...(def ? { def } : {}), // keep the resolved definition for custom substances
      })),
      symptoms,
      notes,
    })
    if (ok) navigate('/dashboard')
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">Build your twin</h1>
          <p className="text-sm text-slate-soft">
            Add what you're currently taking. Takes under two minutes — you can be rough with doses.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Substances */}
          <Card className="p-5">
            <label htmlFor="substance-search" className="text-sm font-bold">What are you taking right now?</label>
            <p className="mb-3 text-xs text-slate-soft">
              Meds, painkillers, energy drinks, supplements, herbal tonics — add anything.
            </p>

            <div className="relative">
              <input
                id="substance-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Search e.g. paracetamol, energy drink, ibuprofen…"
                aria-label="Search substances to add"
                className="input-glass w-full rounded-full px-4 py-3 text-sm outline-none"
              />
              {(query || results.length > 0) && (
                <div className="card-pearl mt-2 overflow-hidden rounded-2xl">
                  {results.length === 0 && query.trim() && (
                    <button
                      type="button"
                      onClick={addCustom}
                      disabled={resolving}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-violet-50 disabled:opacity-70"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-grad text-white">
                        {resolving ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        )}
                      </span>
                      <span>
                        {resolving ? (
                          <>Identifying <span className="font-semibold">“{query.trim()}”</span>…</>
                        ) : (
                          <>
                            Add <span className="font-semibold">“{query.trim()}”</span>
                            <span className="text-slate-soft">
                              {' '}
                              — {holon.canResolveWithAI ? 'we’ll identify it and its risks' : 'as a tracked item'}
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  )}
                  {results.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => addItem(c)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-violet-50"
                    >
                      <span className="font-medium">{c.label}</span>
                      <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-slate-soft">
                        {CATEGORY_LABEL[c.category]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* chosen items */}
            <div className="mt-4 space-y-2">
              {items.length === 0 && (
                <p className="card-inset rounded-xl px-4 py-3 text-sm text-slate-soft">
                  Nothing added yet. Add at least one to build your twin.
                </p>
              )}
              {items.map((it) => (
                <div
                  key={it.substanceId}
                  className="card-pearl flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2.5"
                >
                  <span className="flex flex-1 flex-wrap items-center gap-1.5 text-sm font-semibold">
                    {it.label}
                    {it.def?.custom && (
                      <span
                        className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700"
                        title={`Identified via ${
                          { holon: 'HOLON', ai: 'AI', generic: 'manual entry' }[it.source] || 'lookup'
                        }`}
                      >
                        {{ holon: 'HOLON', ai: '✦ AI', generic: 'manual' }[it.source] || 'added'}
                      </span>
                    )}
                  </span>
                  <div className="card-inset flex items-center gap-1 rounded-xl px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      value={it.dose}
                      onChange={(e) => updateItem(it.substanceId, { dose: Number(e.target.value) })}
                      aria-label={`Dose for ${it.label}`}
                      className="w-16 bg-transparent text-sm outline-none"
                    />
                    <span className="text-xs text-slate-soft">{it.unit}</span>
                  </div>
                  <select
                    value={it.frequency}
                    onChange={(e) => updateItem(it.substanceId, { frequency: e.target.value })}
                    aria-label={`Frequency for ${it.label}`}
                    className="card-inset rounded-xl px-2 py-1.5 text-sm outline-none"
                  >
                    {FREQS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeItem(it.substanceId)}
                    className="grid h-7 w-7 place-items-center rounded-full text-slate-soft transition hover:bg-rose-50 hover:text-rose-700"
                    aria-label={`Remove ${it.label}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Symptoms */}
          <Card className="p-5">
            <p id="symptoms-label" className="text-sm font-bold">
              How are you feeling? <span className="font-normal text-slate-soft">(optional)</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="symptoms-label">
              {SYMPTOMS.map((s) => {
                const on = symptoms.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSymptom(s.id)}
                    aria-pressed={on}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${on ? TOGGLE_ON : TOGGLE_OFF}`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything else? (free text, optional)"
              aria-label="Anything else (optional)"
              className="input-glass mt-3 w-full rounded-2xl px-4 py-3 text-sm outline-none"
            />
          </Card>

          {/* Sleep + stress */}
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <label htmlFor="sleep-hours" className="text-sm font-bold">
                  Sleep last night
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    id="sleep-hours"
                    type="range"
                    min="2"
                    max="10"
                    value={sleep}
                    onChange={(e) => setSleep(Number(e.target.value))}
                    aria-valuetext={`${sleep} hours`}
                    className="w-full accent-violet-600"
                  />
                  <span className="w-16 text-right text-sm font-semibold">{sleep} hrs</span>
                </div>
              </div>
              <div>
                <p id="stress-label" className="text-sm font-bold">
                  Stress
                </p>
                <div className="mt-2 flex gap-1" role="group" aria-labelledby="stress-label">
                  {['low', 'medium', 'high'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setStress(lvl)}
                      aria-pressed={stress === lvl}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition ${
                        stress === lvl ? TOGGLE_ON : TOGGLE_OFF
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {status === 'error' && (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error || 'We could not build your twin just now. Please try again.'}
            </p>
          )}

          {/* Floating action bar: it scrolls over the cards above it, so it gets
              a soft fade behind it rather than colliding with their edges. */}
          <div className="sticky bottom-0 z-10 -mx-1 bg-gradient-to-t from-cream via-cream/95 to-transparent px-1 pb-4 pt-6">
            <Button as="button" type="submit" size="lg" className="w-full" disabled={!canSubmit}>
              {status === 'building' ? 'Building your twin…' : 'Build my twin →'}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
