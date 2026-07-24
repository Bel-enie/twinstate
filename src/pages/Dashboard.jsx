import { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/layout/AppShell.jsx'
import AnatomyModel from '../components/anatomy/AnatomyModel.jsx'
import RiskLegend from '../components/anatomy/RiskLegend.jsx'
import FlagCard from '../components/dashboard/FlagCard.jsx'
import RiskBadge from '../components/ui/RiskBadge.jsx'
import Button from '../components/ui/Button.jsx'
import HealthChat from '../components/chat/HealthChat.jsx'
import LogDose from '../components/dashboard/LogDose.jsx'
import StatCard from '../components/charts/StatCard.jsx'
import Meter from '../components/charts/Meter.jsx'
import PlatformCredit from '../components/ui/PlatformCredit.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { reasoning } from '../services/index.js'
import { scaledBodyTrend } from '../services/mock/engine.js'
import { riskOf } from '../utils/risk.js'

export default function Dashboard() {
  const { twin, items, history, flags, organRisk, overall, notes, bodyIndex, analyzing, statsSource } =
    useTwin()
  const [selected, setSelected] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(true)

  // Change in the (AI-calculated) body-stress index since the start of the week.
  // Uses the same anchored trend as the History page so the delta matches there.
  const weekDelta = useMemo(() => {
    if (!history?.length) return 0
    const trend = scaledBodyTrend(history, bodyIndex)
    return bodyIndex - trend[0].value
  }, [history, bodyIndex])

  useEffect(() => {
    let live = true
    setLoadingSummary(true)
    reasoning
      .summarizeTwin({ name: twin?.name, flags, overall })
      .then((s) => live && setSummary(s))
      .finally(() => live && setLoadingSummary(false))
    return () => {
      live = false
    }
  }, [twin, flags, overall])

  // Flags for the currently hovered/selected organ.
  const shownFlags = useMemo(
    () => (selected ? flags.filter((f) => f.organ === selected) : flags),
    [selected, flags]
  )

  const r = riskOf(overall)

  // "Beloved, 21" -> "Beloved's twin"; "You" -> "Your twin".
  const firstName = twin?.name?.split(',')[0]?.trim()
  const title = !firstName || firstName === 'You' ? 'Your twin' : `${firstName}'s twin`

  return (
    <AppShell wide>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {notes && <p className="text-sm text-slate-soft">{notes}</p>}
        </div>
        <RiskBadge severity={overall} />
      </div>

      <PlatformCredit className="mb-4" />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column: anatomy stage + log dose */}
        <div className="space-y-4">
          <div className="stage-backdrop relative flex flex-col rounded-3xl p-4 shadow-soft">
            <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white/80">
              {flags.length
                ? `${flags.length} flag${flags.length > 1 ? 's' : ''} across ${
                    new Set(flags.map((f) => f.organ)).size
                  } organ${new Set(flags.map((f) => f.organ)).size > 1 ? 's' : ''}`
                : 'No interactions flagged'}
            </p>
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/20"
              >
                Show all
              </button>
            )}
          </div>

          <div className="mx-auto flex h-[38vh] min-h-[300px] w-full max-w-[420px] items-center justify-center">
            <AnatomyModel
              organRisk={organRisk}
              selected={selected}
              onSelect={(k) => setSelected((s) => (s === k ? null : k))}
              callouts
              scale={0.92}
            />
          </div>

          <RiskLegend className="justify-center" />
          <p className="mt-2 text-center text-xs text-white/70">
            Tap an organ to filter what's shown
          </p>
          </div>

          {/* Log a dose lives under the twin now */}
          <LogDose />
        </div>

        {/* Sidebar: AI explanation + flags */}
        <div className="space-y-4">
          {/* Body-stress index */}
          <StatCard
            label="Body-stress index"
            value={bodyIndex}
            unit="/100"
            delta={weekDelta}
            footer="Combined load across all organs · vs start of the week"
          >
            <Meter value={bodyIndex} color={r.hex} />
            <div className="mt-2 text-[11px] font-semibold">
              {analyzing ? (
                <span className="inline-flex items-center gap-1.5 text-brand-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                  AI is analysing your data…
                </span>
              ) : statsSource === 'ai' ? (
                <span className="inline-flex items-center gap-1 text-brand-700">
                  <span>✦</span> Calculated by AI from your logged data
                </span>
              ) : (
                <span className="text-slate-soft">Baseline estimate (formula)</span>
              )}
            </div>
          </StatCard>

          {/* AI summary */}
          <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-500 text-xs text-white">AI</span>
              <span className="text-sm font-bold text-brand-700">Your twin, in plain words</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              {loadingSummary ? 'Reading your twin…' : summary?.text}
            </p>
          </div>

          {/* Flags */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-soft">
                {selected ? `${riskOf(organRisk[selected]?.severity).label} · ${selected}` : 'What we flagged'}
              </h2>
              {flags.length > 0 && (
                <span className="text-xs text-slate-soft">tap for details</span>
              )}
            </div>

            {shownFlags.length === 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                Nothing risky here right now. Keep resting and hydrating.
              </div>
            )}

            {shownFlags.map((flag) => (
              <FlagCard
                key={flag.id}
                flag={flag}
                active={selected === flag.organ}
                onHover={() => setSelected(flag.organ)}
                onLeave={() => {}}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button to="/what-if" size="sm">
              Run What-If →
            </Button>
            <Button to="/recommendation" variant="ghost" size="sm">
              What should I do?
            </Button>
          </div>
        </div>
      </div>

      {/* Ask-about-health chat */}
      <div className="mt-5">
        <HealthChat />
      </div>
    </AppShell>
  )
}
