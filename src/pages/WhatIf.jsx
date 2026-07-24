import { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/layout/AppShell.jsx'
import AnatomyModel from '../components/anatomy/AnatomyModel.jsx'
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

export default function WhatIf() {
  const { organRisk, items, twin } = useTwin()
  const who = twinNaming(twin?.name)
  const [weeks, setWeeks] = useState(2)
  const [path, setPath] = useState('continue') // 'continue' | 'safer'
  const [sim, setSim] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    setLoading(true)
    analysis
      .project({ organRisk, items, weeks })
      .then((s) => live && setSim(s))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [organRisk, items, weeks])

  const active = sim?.[path]
  const shownRisk = useMemo(() => toOrganRisk(active?.organStress), [active])

  return (
    <AppShell wide>
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">What-If</h1>
        <p className="text-sm text-slate-soft">
          Two futures for the same body. Slide the time, flip the path, watch the twin change.
        </p>
        {/* This is a trend sketch, not a prediction: a smooth drift applied to
            today's scores. Saying so plainly is more useful than confident
            copy over a straight line. */}
        <p className="mt-2 inline-flex items-start gap-2 rounded-[12px] border border-risk-watch/30 bg-risk-watch/10 px-3 py-2 text-xs leading-relaxed text-ink/80">
          <span aria-hidden="true">⚠</span>
          <span>
            <strong>Illustrative only — not a prediction.</strong> This projects today's scores
            forward along a simple trend to show the <em>direction</em> of each path. It is not
            modelled on clinical outcome data and cannot tell you what will actually happen to you.
          </span>
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <label className="text-sm font-bold">Look ahead</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="4"
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              aria-label={`Look ahead ${weeks} week${weeks > 1 ? 's' : ''}`}
              className="w-full accent-brand-500"
            />
            <span className="w-24 text-right text-sm font-semibold">
              {weeks} week{weeks > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex rounded-[10px] bg-shell p-1">
          <button
            onClick={() => setPath('continue')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              path === 'continue'
                ? 'bg-white text-risk-caution shadow-card ring-1 ring-risk-caution/30'
                : 'text-slate-soft hover:text-ink'
            }`}
          >
            Keep this pattern
          </button>
          <button
            onClick={() => setPath('safer')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              path === 'safer'
                ? 'bg-white text-risk-calm shadow-card ring-1 ring-risk-calm/30'
                : 'text-slate-soft hover:text-ink'
            }`}
          >
            Rest + hydrate
          </button>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Projected twin */}
        <div className="stage-backdrop relative flex flex-col rounded-[12px] p-4">
          <p className="text-sm font-semibold text-white/80">
            {who.Possessive} twin in {weeks} week{weeks > 1 ? 's' : ''} ·{' '}
            <span style={{ color: path === 'safer' ? '#3FB8A0' : '#EF8354' }}>
              {path === 'safer' ? 'safer path' : 'if nothing changes'}
            </span>
          </p>
          <div className="mx-auto flex h-[46vh] min-h-[320px] w-full max-w-[320px] items-center justify-center">
            <AnatomyModel organRisk={shownRisk} scale={0.82} />
          </div>
          {/* body-stress index */}
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-1 flex justify-between text-xs text-white/80">
              <span>Body-stress index</span>
              <span className="font-semibold">{loading ? '…' : `${active?.bodyIndex}/100`}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${active?.bodyIndex || 0}%`,
                  background: path === 'safer' ? '#3FB8A0' : '#EF8354',
                }}
              />
            </div>
          </div>
        </div>

        {/* Narrative + per-organ compare */}
        <div className="space-y-4">
          <div
            className="rounded-[12px] border p-4"
            style={{
              borderColor: path === 'safer' ? '#bfe8df' : '#f7d6c6',
              background: path === 'safer' ? 'rgba(63,184,160,0.08)' : 'rgba(239,131,84,0.08)',
            }}
          >
            <h2 className="font-bold">{loading ? 'Mapping the two paths…' : active?.headline}</h2>
            <p className="mt-2 text-sm text-ink/80">{!loading && active?.detail}</p>
          </div>

          {/* Side-by-side index */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-soft">Same 2 weeks, two paths</h3>
            <div className="space-y-3">
              {[
                { key: 'continue', label: 'Keep pattern', color: '#EF8354' },
                { key: 'safer', label: 'Rest + hydrate', color: '#3FB8A0' },
              ].map((p) => (
                <div key={p.key}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold">{p.label}</span>
                    <span className="text-slate-soft">{sim?.[p.key]?.bodyIndex ?? '…'}/100</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-shell">
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
            <h3 className="mb-3 text-sm font-bold text-slate-soft">Organ by organ · {path === 'safer' ? 'safer path' : 'current path'}</h3>
            <div className="space-y-2.5">
              {Object.entries(ORGANS).map(([key, o]) => {
                const v = active?.organStress?.[key] ?? 0
                const r = riskOf(stressToEntry(v).severity)
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs font-medium">{o.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-shell">
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
