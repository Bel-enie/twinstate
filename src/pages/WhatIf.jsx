import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import PageHeader, { Chip } from '../components/ui/PageHeader.jsx'
import AppShell from '../components/layout/AppShell.jsx'
import Twin3D from '../components/twin3d/index.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { analysis } from '../services/index.js'
import { ORGANS } from '../services/mock/mockData.js'
import { riskOf } from '../utils/risk.js'
import { twinNaming } from '../utils/naming.js'

// Mirror of the simulation mock's thresholds so the twin colours match.
function stressToEntry(v) {
  const severity = v >= 78 ? 'urgent' : v >= 58 ? 'caution' : v >= 34 ? 'watch' : 'calm'
  return { severity, intensity: v }
}
const toOrganRisk = (organStress = {}) =>
  Object.fromEntries(Object.entries(organStress).map(([k, v]) => [k, stressToEntry(v)]))

const PATHS = [
  { key: 'continue', label: 'Keep this pattern', color: '#EF8354' },
  { key: 'safer', label: 'Rest + hydrate', color: '#3FB8A0' },
]

export default function WhatIf() {
  const { organRisk, items, twin } = useTwin()
  const who = twinNaming(twin?.name)
  const [weeks, setWeeks] = useState(2)
  const [path, setPath] = useState('continue') // 'continue' | 'safer'
  const [sim, setSim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    setLoading(true)
    setFailed(false)
    analysis
      .project({ organRisk, items, weeks })
      .then((s) => live && setSim(s))
      .catch(() => live && setFailed(true))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [organRisk, items, weeks])

  const active = sim?.[path]
  const shownRisk = useMemo(() => toOrganRisk(active?.organStress), [active])
  const pathMeta = PATHS.find((p) => p.key === path)
  const weeksLabel = `${weeks} week${weeks > 1 ? 's' : ''}`

  return (
    <AppShell wide>
      <div className="mb-4">
        <PageHeader
          className="mb-0"
          title="What-If"
          sub="Two futures for the same body. Slide the time, flip the path, watch the twin change."
          actions={<Chip icon={Clock}>{weeksLabel} ahead</Chip>}
        />
        {/* This is a trend sketch, not a prediction: a smooth drift applied to
            today's scores. Saying so plainly is more useful than confident
            copy over a straight line. */}
        <p className="mt-2 inline-flex items-start gap-2 rounded-2xl border border-risk-watch/30 bg-risk-watch/10 px-3 py-2 text-xs leading-relaxed text-ink/80">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk-caution" aria-hidden="true" />
          <span>
            <strong>Illustrative only, not a prediction.</strong> This projects today's scores
            forward along a simple trend to show the <em>direction</em> of each path. It is not
            modelled on clinical outcome data and cannot tell you what will actually happen to you.
          </span>
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <label htmlFor="lookahead" className="text-sm font-bold">
            Look ahead
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="lookahead"
              type="range"
              min="1"
              max="4"
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              aria-valuetext={weeksLabel}
              className="w-full accent-violet-600"
            />
            <span className="w-24 text-right text-sm font-semibold">{weeksLabel}</span>
          </div>
        </div>

        <div className="flex w-full rounded-full border border-ink/10 bg-paper p-1 sm:w-auto" role="group" aria-label="Path">
          {PATHS.map((p) => {
            const on = path === p.key
            return (
              <button
                key={p.key}
                onClick={() => setPath(p.key)}
                aria-pressed={on}
                className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition sm:flex-none sm:px-4 ${
                  on ? 'bg-brand-grad text-white shadow-[0_8px_22px_-10px_rgba(124,92,240,0.7)]' : 'text-slate-soft hover:text-ink'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden="true" />
                {p.label}
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Projected twin */}
        <div className="stage-backdrop relative flex flex-col rounded-2xl p-4">
          <p className="text-sm font-semibold text-white/80">
            {who.Possessive} twin in {weeksLabel} ·{' '}
            <span style={{ color: pathMeta.color }}>{path === 'safer' ? 'safer path' : 'if nothing changes'}</span>
          </p>
          <div className="mx-auto flex h-[46vh] min-h-[320px] w-full max-w-[320px] items-center justify-center">
            <Twin3D organRisk={shownRisk} />
          </div>
          {/* body-stress index */}
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-1 flex justify-between text-xs text-white/80">
              <span>Interaction load</span>
              <span className="font-semibold">{loading ? '…' : `${active?.bodyIndex ?? '…'}/100`}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${active?.bodyIndex || 0}%`, background: pathMeta.color }}
              />
            </div>
          </div>
        </div>

        {/* Narrative + per-organ compare */}
        <div className="space-y-4">
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: path === 'safer' ? '#bfe8df' : '#f7d6c6',
              background: path === 'safer' ? 'rgba(63,184,160,0.08)' : 'rgba(239,131,84,0.08)',
            }}
            aria-live="polite"
          >
            <h2 className="font-bold">
              {loading ? 'Mapping the two paths…' : failed ? 'The projection could not run' : active?.headline}
            </h2>
            <p className="mt-2 text-sm text-ink/80">
              {!loading && (failed ? 'Try moving the slider again in a moment.' : active?.detail)}
            </p>
          </div>

          {/* Side-by-side index */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-soft">Same {weeksLabel}, two paths</h3>
            <div className="space-y-3">
              {PATHS.map((p) => (
                <div key={p.key}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold">{p.label}</span>
                    <span className="text-slate-soft">{sim?.[p.key]?.bodyIndex ?? '…'}/100</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${sim?.[p.key]?.bodyIndex || 0}%`, background: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Per-organ mini compare for active path */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-soft">
              Organ by organ · {path === 'safer' ? 'safer path' : 'current path'}
            </h3>
            <div className="space-y-2.5">
              {Object.entries(ORGANS).map(([key, o]) => {
                const v = active?.organStress?.[key] ?? 0
                const r = riskOf(stressToEntry(v).severity)
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs font-medium">{o.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${v}%`, background: r.hex }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-slate-soft">{v}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          <Button to="/recommendation" className="w-full">
            What should I do? →
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
