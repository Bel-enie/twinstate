import { useEffect, useState } from 'react'
import AppShell from '../components/layout/AppShell.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { reasoning } from '../services/index.js'
import { twinNaming } from '../utils/naming.js'
import { coverageOf, clearanceCopy, labelOf } from '../services/analysis/coverage.js'

const LEVELS = {
  // Not "You're good" — the engine only knows a small curated rule set, so the
  // honest claim is about what was checked, never about the person being fine.
  all_clear: { color: '#3FB8A0', bg: 'rgba(63,184,160,0.10)', icon: '✓', tag: 'Nothing flagged' },
  monitor: { color: '#3FB8A0', bg: 'rgba(63,184,160,0.10)', icon: '👀', tag: 'Monitor at home' },
  clinic_soon: { color: '#EF8354', bg: 'rgba(239,131,84,0.10)', icon: '🩺', tag: 'Campus clinic soon' },
  seek_care: { color: '#E0567A', bg: 'rgba(224,86,122,0.10)', icon: '⚠️', tag: 'Seek care urgently' },
}

// Visual triage ladder.
const LADDER = [
  { key: 'monitor', label: 'Monitor at home' },
  { key: 'clinic_soon', label: 'Campus clinic soon' },
  { key: 'seek_care', label: 'Seek care urgently' },
]

export default function Recommendation() {
  const { twin, flags, overall, items, symptoms } = useTwin()
  const coverage = coverageOf(items)
  const clearance = clearanceCopy(coverage)
  const [rec, setRec] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    setLoading(true)
    reasoning
      .recommend({ name: twin?.name, flags, overall, items, symptoms })
      .then((r) => live && setRec(r))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [twin, flags, overall, items, symptoms])

  const meta = LEVELS[rec?.level] || LEVELS.monitor
  const level = rec?.level
  const activeIdx = LADDER.findIndex((l) => l.key === rec?.level)
  const who = twinNaming(twin?.name)
  const title = who.isSelf ? 'What should I do now?' : `What should ${who.first} do now?`

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-sm text-slate-soft">One clear next step, based on everything in {who.possessive} twin.</p>
        </div>

        {/* Headline action */}
        <div
          className="rounded-3xl border p-6 shadow-soft"
          style={{ background: meta.bg, borderColor: meta.color }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: meta.color }}>
            <span className="text-lg">{meta.icon}</span>
            {level === 'all_clear' ? clearance.tag : meta.tag}
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
            {loading ? 'Thinking it through…' : rec?.action}
          </h2>
          <p className="mt-2 text-ink/80">{!loading && rec?.subtext}</p>
          {!loading && level === 'all_clear' && (
            <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-ink/70" style={{ borderColor: meta.color }}>
              {clearance.note}
            </p>
          )}
        </div>

        {/* What we could not check. Shown before any reassurance so an
            unrecognised substance is never hidden behind a teal tick. */}
        {coverage.unchecked.length > 0 && (
          <Card className="mt-5 border border-risk-watch/40 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <span aria-hidden="true">⚠</span> Not checked ({coverage.unchecked.length})
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-soft">
              We could not identify these, so no interaction rule ran against them. Their absence
              from the flags above means nothing either way — ask a pharmacist about them.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {coverage.unchecked.map((it, i) => (
                <li key={i} className="rounded-full bg-shell px-3 py-1 text-xs font-medium">
                  {labelOf(it)}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {coverage.hasUnverified && (
          <Card className="mt-5 p-5">
            <h3 className="text-sm font-bold text-ink">AI-identified, unverified</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-soft">
              These were matched by the AI rather than a curated entry, so the properties used to
              screen them may be wrong or incomplete.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {coverage.unverified.map((it, i) => (
                <li key={i} className="rounded-full bg-shell px-3 py-1 text-xs font-medium">
                  {labelOf(it)}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Triage ladder */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {LADDER.map((l, i) => {
            const on = i <= activeIdx && activeIdx >= 0
            const isCurrent = i === activeIdx
            const c = LEVELS[l.key]
            return (
              <div
                key={l.key}
                className={`rounded-2xl border p-3 text-center transition ${
                  isCurrent ? 'shadow-soft' : ''
                }`}
                style={{
                  borderColor: on ? c.color : 'rgba(31,36,48,0.08)',
                  background: isCurrent ? c.bg : 'white',
                }}
              >
                <div className="text-lg">{c.icon}</div>
                <div className="mt-1 text-xs font-semibold" style={{ color: on ? c.color : '#5B6472' }}>
                  {l.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Safer swaps */}
        {rec?.swaps?.length > 0 && (
          <Card className="mt-5 p-5">
            <h3 className="text-sm font-bold text-slate-soft">Make these swaps</h3>
            <ul className="mt-3 space-y-2.5">
              {rec.swaps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs text-emerald-700">
                    ✓
                  </span>
                  <span className="text-ink/85">{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Emergency note for high risk */}
        {rec?.level === 'seek_care' && (
          <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
            If you feel very unwell — chest pain, trouble breathing, confusion, or you can't keep
            fluids down — treat it as an emergency and get help immediately.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button to="/dashboard">
            Back to {who.possessive} twin
          </Button>
          <Button to="/what-if" variant="ghost">
            Compare the two paths
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-soft">
          Educational guidance, not a diagnosis. When in doubt, talk to a pharmacist or your health centre.
        </p>
      </div>
    </AppShell>
  )
}
