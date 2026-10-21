import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Clock,
  FlaskConical,
  Leaf,
  Maximize2,
  MessageSquareText,
  Pill,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import AppShell from '../components/layout/AppShell.jsx'
import Twin3D from '../components/twin3d/index.jsx'
import RiskBadge from '../components/ui/RiskBadge.jsx'
import Button from '../components/ui/Button.jsx'
import Panel from '../components/ui/Panel.jsx'
import PageHeader, { Chip } from '../components/ui/PageHeader.jsx'
import Meter from '../components/charts/Meter.jsx'
import HealthChat from '../components/chat/HealthChat.jsx'
import LogDose from '../components/dashboard/LogDose.jsx'
import PlatformCredit from '../components/ui/PlatformCredit.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { reasoning } from '../services/index.js'
import { buildContext, scaledBodyTrend } from '../services/mock/engine.js'
import { ORGANS, SUBSTANCE_BY_ID } from '../services/mock/mockData.js'
import { RISK, riskOf, CATEGORY_LABEL } from '../utils/risk.js'
import { coverageOf, labelOf } from '../services/analysis/coverage.js'
import { buildDays } from '../components/landing/twinData.js'

const CAFFEINE_LINE = 400
const PARACETAMOL_CEILING = 4000
const CATEGORY_ICON = { prescription: Pill, otc: Pill, energy_drink: Zap, supplement: FlaskConical, herbal: Leaf }
const shortOrgan = (key) => ORGANS[key].label.split(' &')[0]
const fmt = (n) => Number(n || 0).toLocaleString('en-US')

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/** Seven little bars, newest on the right and highlighted. */
function Bars({ values, max = 100 }) {
  return (
    <div className="flex h-10 items-end gap-[3px]" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full ${i === values.length - 1 ? 'bg-brand-grad' : 'bg-brand-200/70'}`}
          style={{ height: `${Math.max(8, Math.min(100, (v / max) * 100))}%` }}
        />
      ))}
    </div>
  )
}

/** One metric in the body-analysis panel: label, Detail link, goal line, hero number, chart. */
function MetricTile({ label, detailTo, goal, goalValue, value, unit, children }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {detailTo && (
          <Link to={detailTo} className="rounded-full bg-paper px-3 py-1 text-[11px] font-semibold transition hover:bg-violet-50 hover:text-violet-700">
            Detail
          </Link>
        )}
      </div>
      <div className="mt-3 rounded-xl border border-ink/5 bg-paper/70 p-3">
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-soft">
          <span>{goal}</span>
          <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-ink">{goalValue}</span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <span className="font-display text-4xl font-extrabold leading-none tracking-[-0.03em]">
            <span className="bg-brand-grad bg-clip-text text-transparent">{value}</span>
            {unit && <span className="ml-0.5 text-sm font-semibold text-slate-soft">{unit}</span>}
          </span>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { twin, items, history, flags, organRisk, overall, bodyIndex, analyzing, statsSource } = useTwin()
  const coverage = coverageOf(items)
  const { hash } = useLocation()
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim().toLowerCase()

  const [selected, setSelected] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [summary, setSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(true)

  // The header bell links to /dashboard#flags: bring the flags into view.
  useEffect(() => {
    if (hash !== '#flags') return
    document.getElementById('flags')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  useEffect(() => {
    let live = true
    setLoadingSummary(true)
    reasoning
      .summarizeTwin({ name: twin?.name, flags, overall })
      .then((s) => live && setSummary(s))
      .catch(() => live && setSummary({ text: 'We could not write the plain-language summary just now. The flags are still current.' }))
      .finally(() => live && setLoadingSummary(false))
    return () => {
      live = false
    }
  }, [twin, flags, overall])

  // Today's figures from the same rule engine that scores the twin.
  const ctx = useMemo(() => buildContext(items), [items])
  const caffeine = ctx.totalCaffeine()
  const paracetamol = ctx.dailyMg('paracetamol')
  const trend = useMemo(() => (history?.length ? scaledBodyTrend(history, bodyIndex) : []), [history, bodyIndex])
  const weekDelta = trend.length ? bodyIndex - trend[0].value : 0
  const days = useMemo(() => buildDays(history || []), [history])

  // Which organ the floating card describes: the tapped one, else the worst.
  const worstOrgan = useMemo(() => {
    const order = ['urgent', 'caution', 'watch', 'calm']
    return Object.keys(ORGANS).sort(
      (a, b) => order.indexOf(organRisk[a]?.severity || 'calm') - order.indexOf(organRisk[b]?.severity || 'calm')
    )[0]
  }, [organRisk])
  const focus = selected || worstOrgan
  const focusRisk = organRisk[focus] || { severity: 'calm', intensity: 0 }

  const matches = (text) => !q || String(text || '').toLowerCase().includes(q)
  const shownItems = items.filter((it) => {
    const def = SUBSTANCE_BY_ID[it.substanceId] || it.def
    return matches(def?.label || it.substanceId)
  })
  const shownFlags = flags.filter(
    (f) => (!selected || f.organ === selected) && (matches(f.title) || f.substances.some((s) => matches(s.label)))
  )
  const flaggedIds = useMemo(() => new Set(flags.flatMap((f) => f.substances.map((s) => s.id))), [flags])

  const firstName = twin?.name?.split(',')[0]?.trim()
  const who = !firstName || firstName === 'You' ? '' : `, ${firstName}`
  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const r = riskOf(overall)

  return (
    <AppShell wide>
      <PageHeader
        title={`${greeting()}${who}`}
        sub={
          flags.length
            ? `You have ${flags.length} flag${flags.length === 1 ? '' : 's'} today · ${r.label.toLowerCase()}`
            : 'Nothing flagged among what we could check today'
        }
        actions={
          <>
            <Chip icon={CalendarDays}>{today}</Chip>
            <Chip icon={Clock}>{analyzing ? 'Updating…' : 'Live'}</Chip>
            <Button to="/what-if" className="px-5 py-2.5">
              What-If <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        }
      />

      {q && (
        <p className="mb-4 flex items-center gap-2 text-sm text-slate-soft">
          Showing matches for <span className="font-semibold text-ink">“{params.get('q')}”</span>
          <Link to="/dashboard" className="font-semibold text-violet-600 hover:underline">
            Clear
          </Link>
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,44%)_1fr]">
        {/* ── Left: the twin ─────────────────────────────────────────── */}
        <div>
          <div className="relative">
            <div className="stage-backdrop h-[520px] overflow-hidden rounded-[28px]">
              <div className="h-full w-full transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
                <Twin3D organRisk={organRisk} selected={selected} onSelect={(k) => setSelected((s) => (s === k ? null : k))} />
              </div>
            </div>

            {/* zoom pill */}
            <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-full border border-white/20 bg-white/90 p-1 shadow-card backdrop-blur" role="group" aria-label="Zoom">
              <button type="button" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))} aria-label="Zoom in" className="grid h-9 w-9 place-items-center rounded-full text-ink/80 transition hover:bg-violet-50 hover:text-violet-700">
                <ZoomIn className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setZoom(1)} aria-label="Reset zoom" className="grid h-9 w-9 place-items-center rounded-full bg-paper text-ink/80 transition hover:bg-violet-50 hover:text-violet-700">
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))} aria-label="Zoom out" className="grid h-9 w-9 place-items-center rounded-full text-ink/80 transition hover:bg-violet-50 hover:text-violet-700">
                <ZoomOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* floating organ card */}
            <div className="absolute bottom-4 right-4 w-[min(260px,calc(100%-2rem))] rounded-2xl border border-white/60 bg-white/95 p-4 shadow-soft backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: `${RISK[focusRisk.severity].hex}22`, color: RISK[focusRisk.severity].hex }}>
                    <Activity className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {shortOrgan(focus)}
                </span>
                <RiskBadge severity={focusRisk.severity} />
              </div>
              <div className="mt-3 rounded-xl border border-ink/5 bg-paper/70 p-3">
                <div className="flex items-center justify-between text-[11px] text-slate-soft">
                  <span>Load</span>
                  <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-ink">{focusRisk.intensity ?? 0}/100</span>
                </div>
                <Meter value={focusRisk.intensity ?? 0} color={RISK[focusRisk.severity].hex} height={8} />
                {focusRisk.note && <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-slate-soft">{focusRisk.note}</p>}
              </div>
            </div>
          </div>

          {/* organ thumbnails */}
          <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3" role="group" aria-label="Organs">
            {Object.keys(ORGANS).map((k) => {
              const sev = organRisk[k]?.severity || 'calm'
              const on = selected === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected((s) => (s === k ? null : k))}
                  aria-pressed={on}
                  className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition ${
                    on ? 'border-violet-400 bg-violet-50 shadow-card' : 'border-ink/10 bg-white hover:border-violet-300'
                  }`}
                >
                  <span
                    className="h-10 w-10 rounded-full"
                    style={{ background: `radial-gradient(circle at 35% 35%, #fff 0%, ${RISK[sev].hex} 55%, ${RISK[sev].hex}99 100%)`, boxShadow: `0 8px 18px -8px ${RISK[sev].hex}` }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold leading-tight">{shortOrgan(k)}</span>
                  <span className="text-[10px] capitalize text-slate-soft">{sev}</span>
                </button>
              )
            })}
          </div>

          <PlatformCredit className="mt-4" />
        </div>

        {/* ── Right: analysis, lists, next step ─────────────────────── */}
        <div className="space-y-6">
          <Panel
            icon={BarChart3}
            title="Body analysis"
            info="Every number here comes from the deterministic rule engine; the AI may only raise a severity band and write prose."
            aside={
              <>
                <Chip icon={Activity} className="px-3 py-1.5 text-xs">
                  {analyzing ? 'Updating…' : statsSource === 'ai' ? 'AI reviewed' : 'Real time'}
                </Chip>
              </>
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricTile label="Body-stress index" detailTo="/history" goal="vs start of week" goalValue={`${weekDelta > 0 ? '+' : ''}${weekDelta}`} value={bodyIndex} unit="/100">
                <Bars values={trend.length ? trend.map((t) => t.value) : [bodyIndex]} />
              </MetricTile>
              <MetricTile label="Caffeine today" detailTo="/history" goal="Daily line" goalValue={`~${CAFFEINE_LINE} mg`} value={fmt(caffeine)} unit="mg">
                <Meter value={caffeine} max={Math.max(CAFFEINE_LINE * 2, caffeine)} color={caffeine >= CAFFEINE_LINE ? RISK.caution.hex : RISK.calm.hex} height={10} />
              </MetricTile>
              <MetricTile label="Paracetamol today" detailTo="/history" goal="Daily ceiling" goalValue={`${fmt(PARACETAMOL_CEILING)} mg`} value={fmt(paracetamol)} unit="mg">
                <div className="flex h-10 items-end justify-end gap-2" aria-hidden="true">
                  <span className="w-5 rounded-md bg-brand-grad" style={{ height: `${Math.max(8, Math.min(100, (paracetamol / PARACETAMOL_CEILING) * 100))}%` }} />
                  <span className="h-full w-5 rounded-md bg-brand-200/60" />
                </div>
              </MetricTile>
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Medication list */}
            <Panel
              icon={Pill}
              title="Medication list"
              info="Everything logged on the twin. Highlighted rows are part of an active flag."
              aside={<span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold">{items.length}</span>}
              bodyClassName="space-y-2"
            >
              {shownItems.length === 0 && <p className="text-sm text-slate-soft">{q ? 'No substance matches that search.' : 'Nothing logged yet.'}</p>}
              {shownItems.map((it) => {
                const def = SUBSTANCE_BY_ID[it.substanceId] || it.def || {}
                const Icon = CATEGORY_ICON[def.category] || Pill
                const flagged = flaggedIds.has(it.substanceId)
                const hot = flagged && (!selected || flags.some((f) => f.organ === selected && f.substances.some((s) => s.id === it.substanceId)))
                return (
                  <div
                    key={it.substanceId}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                      hot ? 'border-transparent bg-brand-grad text-white shadow-[0_12px_30px_-12px_rgba(124,92,240,0.8)]' : 'border-ink/10 bg-white'
                    }`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${hot ? 'bg-white/20 text-white' : 'bg-violet-50 text-violet-600'}`}>
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{(def.label || it.substanceId).split(' (')[0]}</span>
                      <span className={`block text-xs ${hot ? 'text-white/80' : 'text-slate-soft'}`}>
                        {it.dose} {def.unit || ''} · {it.frequency || `×${it.times || 1}/day`} · {CATEGORY_LABEL[def.category] || 'Tracked'}
                      </span>
                    </span>
                    {flagged && !hot && <span className="h-2 w-2 shrink-0 rounded-full bg-risk-caution" aria-label="In an active flag" />}
                  </div>
                )
              })}
              {coverage.unchecked.length > 0 && (
                <div className="rounded-2xl border border-risk-watch/40 bg-risk-watch/10 p-3 text-sm">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-4 w-4 text-risk-caution" aria-hidden="true" /> Not checked ({coverage.unchecked.length})
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink/75">We could not identify these, so no rule ran against them. Ask a pharmacist.</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {coverage.unchecked.map((it, i) => (
                      <li key={i} className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium">{labelOf(it)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>

            {/* This week + flags */}
            <Panel
              id="flags"
              className="scroll-mt-28"
              icon={CalendarDays}
              title="This week"
              info="One pill per day, coloured by that day's overall state; the flags below are today's."
              aside={
                <Link to="/history" className="rounded-full bg-paper px-3 py-1 text-xs font-semibold transition hover:bg-violet-50 hover:text-violet-700">
                  Replay
                </Link>
              }
            >
              {days.length > 0 && (
                <div className="grid grid-cols-7 gap-1.5">
                  {days.map((d, i) => {
                    const last = i === days.length - 1
                    const sev = d.state.overall || 'calm'
                    return (
                      <div
                        key={d.label}
                        title={`${d.dateLabel} · ${sev} · load ${d.bodyIndex}`}
                        className={`flex flex-col items-center gap-2 rounded-full py-2.5 ${last ? 'bg-brand-grad text-white' : 'bg-paper text-slate-soft'}`}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: last ? '#fff' : RISK[sev].hex }} aria-hidden="true" />
                        <span className="text-xs font-semibold">{d.date.getDate()}</span>
                        <span className="sr-only">{`${d.dateLabel}: ${sev}`}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-4 space-y-2">
                {shownFlags.length === 0 && (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
                    {q || selected ? 'No flag matches.' : 'Nothing flagged among what we could check — not a clean bill of health, just no rule in our set fired.'}
                  </p>
                )}
                {shownFlags.map((f) => (
                  <Link
                    key={f.id}
                    to={`/interaction/${f.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white p-3 transition hover:border-violet-300 hover:bg-violet-50/40"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: `${RISK[f.severity].hex}22`, color: RISK[f.severity].hex }}>
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{f.title}</span>
                      <span className="block text-xs text-slate-soft">{shortOrgan(f.organ)} · {RISK[f.severity].label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-soft" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Plain words */}
            <Panel icon={MessageSquareText} title="In plain words" info="A short read of the twin, grounded in the flags.">
              <p className="text-sm leading-relaxed text-ink/80">{loadingSummary ? 'Reading your twin…' : summary?.text}</p>
              <p className="mt-3 border-t border-[color:var(--panel-line)] pt-3 text-[11px] font-semibold">
                {analyzing ? (
                  <span className="inline-flex items-center gap-1.5 text-violet-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" /> AI is reviewing your data…
                  </span>
                ) : statsSource === 'ai' ? (
                  <span className="inline-flex items-center gap-1 text-violet-700">
                    <Sparkles className="h-3 w-3" aria-hidden="true" /> Reviewed by AI · numbers from the rule engine
                  </span>
                ) : (
                  <span className="text-slate-soft">Baseline estimate (formula)</span>
                )}
              </p>
            </Panel>

            {/* Next step — dark card */}
            <div className="hero-card relative overflow-hidden rounded-[26px] p-6 text-frost">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Next step</p>
                  <p className="mt-1 text-xs text-mist">{flags.length ? `Based on ${flags.length} flag${flags.length === 1 ? '' : 's'}` : 'Nothing flagged right now'}</p>
                </div>
                <Link to="/recommendation" aria-label="Open the next step" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink transition hover:bg-violet-50">
                  <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-6 font-display text-2xl font-extrabold tracking-[-0.02em]">{r.label}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {flags.slice(0, 3).map((f) => (
                  <span key={f.id} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold">
                    {shortOrgan(f.organ)} · {f.severity}
                  </span>
                ))}
                {!flags.length && <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold">Keep logging</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <LogDose />
      </div>
      <div className="mt-6">
        <HealthChat />
      </div>
    </AppShell>
  )
}
