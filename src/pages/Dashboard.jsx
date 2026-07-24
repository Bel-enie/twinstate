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
import Panel from '../components/ui/Panel.jsx'
import Meter from '../components/charts/Meter.jsx'
import PlatformCredit from '../components/ui/PlatformCredit.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { reasoning } from '../services/index.js'
import { scaledBodyTrend } from '../services/mock/engine.js'
import { riskOf } from '../utils/risk.js'
import { coverageOf, labelOf } from '../services/analysis/coverage.js'

export default function Dashboard() {
  const { twin, items, history, flags, organRisk, overall, notes, bodyIndex, analyzing, statsSource } =
    useTwin()
  const coverage = coverageOf(items)
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
  const organCount = useMemo(() => new Set(flags.map((f) => f.organ)).size, [flags])

  // "Beloved, 21" -> "Beloved's twin"; "You" -> "Your twin".
  const firstName = twin?.name?.split(',')[0]?.trim()
  const title = !firstName || firstName === 'You' ? 'Your twin' : `${firstName}'s twin`

  return (
    <AppShell wide>
      {/* Page header: eyebrow + title, state on the right. */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="panel-eyebrow">Health twin · live</p>
          <h1 className="mt-1.5 text-[28px] font-extrabold leading-tight tracking-tight">{title}</h1>
          {notes && <p className="mt-1 text-sm leading-relaxed text-slate-soft">{notes}</p>}
        </div>
        <RiskBadge severity={overall} />
      </div>

      <PlatformCredit className="mb-6" />

      {/* Stat row: four equal tiles on one baseline, the page's top line. */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Body-stress index"
          value={bodyIndex}
          unit="/100"
          delta={weekDelta}
          tone={r.key || 'neutral'}
          footer="Combined load across all organs · vs start of the week"
        >
          <Meter value={bodyIndex} color={r.hex} />
        </StatCard>
        <StatCard
          label="Active flags"
          value={flags.length}
          tone={flags.length ? 'watch' : 'calm'}
          footer={
            flags.length
              ? `Across ${organCount} organ${organCount > 1 ? 's' : ''}`
              : 'No rule in our set fired'
          }
        />
        <StatCard
          label="Checked"
          value={coverage.checked}
          unit={`/${coverage.total}`}
          tone="calm"
          footer="Substances matched to a known interaction rule"
        />
        <StatCard
          label="Not checked"
          value={coverage.unchecked.length}
          tone={coverage.unchecked.length ? 'watch' : 'neutral'}
          footer="Unidentified · no rule ran against these"
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column: anatomy stage + log dose */}
        <div className="space-y-5">
          <Panel
            eyebrow="Anatomical view"
            title="Where the load lands"
            sub="Tap an organ to filter what's shown below."
            aside={
              selected ? (
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-[8px] border border-[color:var(--panel-line)] bg-white px-2.5 py-1 text-xs font-semibold text-slate-soft transition-colors hover:bg-shell"
                >
                  Show all
                </button>
              ) : null
            }
            bodyClassName="flex flex-col"
          >
            {/* The anatomy figure is drawn for a dark ground (white organ
                strokes, pale mesh, neon glow), so the stage keeps its own dark
                surface nested inside the white panel rather than inverting the
                whole illustration. Inner radius steps down from the panel's. */}
            <div className="stage-backdrop overflow-hidden rounded-[8px] p-4">
              <div className="mx-auto flex h-[38vh] min-h-[300px] w-full max-w-[420px] items-center justify-center">
                <AnatomyModel
                  organRisk={organRisk}
                  selected={selected}
                  onSelect={(k) => setSelected((s) => (s === k ? null : k))}
                  callouts
                  scale={0.92}
                />
              </div>
              <RiskLegend className="mt-2 justify-center" />
            </div>
          </Panel>

          {/* Log a dose lives under the twin now */}
          <LogDose />
        </div>

        {/* Sidebar: AI explanation + flags */}
        <div className="space-y-5">
          <Panel eyebrow="Plain language" title="Your twin, in plain words">
            <p className="text-sm leading-relaxed text-ink/80">
              {loadingSummary ? 'Reading your twin…' : summary?.text}
            </p>
            <p className="mt-3 border-t border-[color:var(--panel-line)] pt-3 text-[11px] font-semibold">
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
            </p>
          </Panel>

          {/* Flags */}
          <Panel
            eyebrow="Interaction register"
            title={
              selected
                ? `${riskOf(organRisk[selected]?.severity).label} · ${selected}`
                : 'What we flagged'
            }
            sub={flags.length > 0 ? 'Tap any flag for the evidence behind it.' : undefined}
            bodyClassName="space-y-3"
          >
            {shownFlags.length === 0 && (
              <div
                className="border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900"
                style={{ borderRadius: 'var(--panel-r)' }}
              >
                Nothing flagged among what we could check. That is not a clean bill of health — it
                means no rule in our limited set fired.
              </div>
            )}

            {/* An unidentified substance runs against no rule at all, so it must
                never sit silently behind a green panel. */}
            {coverage.unchecked.length > 0 && (
              <div
                className="border border-risk-watch/40 bg-risk-watch/10 p-4 text-sm"
                style={{ borderRadius: 'var(--panel-r)' }}
              >
                <div className="flex items-center gap-2 font-bold text-ink">
                  <span aria-hidden="true">⚠</span> Not checked ({coverage.unchecked.length})
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink/75">
                  We could not identify these, so no interaction rule ran against them. Ask a
                  pharmacist about anything here.
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {coverage.unchecked.map((it, i) => (
                    <li
                      key={i}
                      className="rounded-[6px] border border-[color:var(--panel-line)] bg-white/80 px-2.5 py-1 text-xs font-medium"
                    >
                      {labelOf(it)}
                    </li>
                  ))}
                </ul>
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
          </Panel>

          {/* Actions sit on their own panel rather than floating loose, so the
              sidebar column ends on the same edge it started on. */}
          <div className="panel flex flex-col gap-2 p-4">
            <p className="panel-eyebrow">Next step</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Button to="/what-if" size="sm">
                Run What-If →
              </Button>
              <Button to="/recommendation" variant="ghost" size="sm">
                What should I do?
              </Button>
            </div>
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
