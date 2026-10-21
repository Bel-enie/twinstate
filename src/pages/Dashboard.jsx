import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
  Leaf,
  Lock,
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
import Gauge from '../components/charts/Gauge.jsx'
import HealthChat from '../components/chat/HealthChat.jsx'
import LogDose from '../components/dashboard/LogDose.jsx'
import PlatformCredit from '../components/ui/PlatformCredit.jsx'
import FlagEvidence from '../components/ui/FlagEvidence.jsx'
import { privacyLine } from '../services/privacy.js'
import { LOAD_LABEL } from '../components/landing/twinData.js'
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

const VITALS = {
  caffeine: { label: 'Caffeine', unit: 'mg', line: CAFFEINE_LINE, lineLabel: 'daily line' },
  paracetamol: { label: 'Paracetamol', unit: 'mg', line: PARACETAMOL_CEILING, lineLabel: 'daily ceiling' },
}

/**
 * The dark "vital stats" card: one intake metric (switchable) shown as
 * value / limit, a strip of thin bars filled to the value, a 0-max scale and
 * a status pill. The twin's two threshold rules are the two metrics.
 */
function VitalCard({ caffeine, paracetamol }) {
  const [key, setKey] = useState('caffeine')
  const v = VITALS[key]
  const value = key === 'caffeine' ? caffeine : paracetamol
  const max = Math.max(v.line, Math.ceil(value / 100) * 100)
  const bars = 28
  const filled = Math.round(Math.min(1, value / max) * bars)
  let status
  if (key === 'caffeine') {
    status = value >= CAFFEINE_LINE ? { text: 'Over the line', sev: 'caution' } : value > 0 ? { text: 'Within the line', sev: 'calm' } : { text: 'None logged', sev: 'calm' }
  } else {
    status =
      value >= PARACETAMOL_CEILING ? { text: 'Over the ceiling', sev: 'urgent' }
      : value >= 3000 ? { text: 'At the line', sev: 'caution' }
      : value > 0 ? { text: 'Within the ceiling', sev: 'calm' }
      : { text: 'None logged', sev: 'calm' }
  }

  return (
    <div className="hero-card rounded-2xl p-5 text-frost">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2.5 whitespace-nowrap text-sm font-bold">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </span>
          Vital stats
        </span>
        <label className="relative">
          <span className="sr-only">Metric</span>
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="appearance-none rounded-full border border-white/20 bg-white/10 py-1.5 pl-3 pr-8 text-xs font-semibold text-frost outline-none focus:border-white/50"
          >
            {Object.entries(VITALS).map(([k, m]) => (
              <option key={k} value={k} className="text-ink">
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-frost/80" aria-hidden="true" />
        </label>
      </div>

      <div className="mt-5 font-display text-4xl font-extrabold leading-none tracking-[-0.03em]">
        {fmt(value)}
        <span className="text-mist">/{fmt(v.line)}</span>
        <span className="ml-1.5 text-sm font-semibold text-mist">{v.unit}</span>
      </div>

      <div className="mt-4 flex h-14 items-end gap-[3px]" aria-hidden="true">
        {Array.from({ length: bars }, (_, i) => (
          <span key={i} className={`h-full flex-1 rounded-full ${i < filled ? 'bg-white' : 'bg-white/25'}`} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-mist">
        <span>0</span>
        <span>{fmt(max / 2)}</span>
        <span>{fmt(max)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-mist">
          {v.label} · {v.lineLabel} {fmt(v.line)} {v.unit}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: `${RISK[status.sev].hex}33` }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: RISK[status.sev].hex }} aria-hidden="true" />
          {status.text}
        </span>
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
            <Chip icon={Clock}>{analyzing ? 'Updating…' : 'Up to date'}</Chip>
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

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)]">
        {/* ── Left: the twin (stays in view while the right column scrolls) ── */}
        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <div className="relative">
            <div className="stage-backdrop h-[360px] overflow-hidden rounded-[28px] sm:h-[460px] lg:h-[520px]">
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
            <div className="mt-3 w-full rounded-2xl border border-ink/10 bg-white/95 p-4 shadow-soft backdrop-blur sm:absolute sm:bottom-4 sm:right-4 sm:mt-0 sm:w-[260px] sm:border-white/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
          <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-3" role="group" aria-label="Organs">
            {Object.keys(ORGANS).map((k) => {
              const sev = organRisk[k]?.severity || 'calm'
              const on = selected === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected((s) => (s === k ? null : k))}
                  aria-pressed={on}
                  className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 text-center transition sm:gap-2 sm:px-2 sm:py-3 ${
                    on ? 'border-violet-400 bg-violet-50 shadow-card' : 'border-ink/10 bg-white hover:border-violet-300'
                  }`}
                >
                  <span
                    className="h-8 w-8 rounded-full sm:h-10 sm:w-10"
                    style={{ background: `radial-gradient(circle at 35% 35%, #fff 0%, ${RISK[sev].hex} 55%, ${RISK[sev].hex}99 100%)`, boxShadow: `0 8px 18px -8px ${RISK[sev].hex}` }}
                    aria-hidden="true"
                  />
                  <span className="w-full truncate text-[11px] font-semibold leading-tight sm:text-xs">{shortOrgan(k)}</span>
                  <span className="text-[10px] capitalize text-slate-soft">{sev}</span>
                </button>
              )
            })}
          </div>

          <PlatformCredit className="mt-4" />
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-soft">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" aria-hidden="true" />
            <span>
              {privacyLine()}{' '}
              <Link to="/limits" className="font-semibold text-violet-600 hover:underline">
                How it works and its limits
              </Link>
            </span>
          </p>
        </div>

        {/* ── Right: analysis, lists, next step ─────────────────────── */}
        <div className="min-w-0 space-y-6">
          <Panel
            icon={BarChart3}
            title="Body analysis"
            info="Every number here comes from Twinstate’s fixed rules, so the same log always gives the same number. AI can only raise a warning and write the wording."
            aside={
              <>
                <Chip icon={Activity} className="px-3 py-1.5 text-xs">
                  {analyzing ? 'Updating…' : statsSource === 'ai' ? 'AI reviewed' : 'Rules only'}
                </Chip>
              </>
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Dark vital-stats card: one intake metric against its line. */}
              <VitalCard caffeine={caffeine} paracetamol={paracetamol} />

              {/* Gauge: the body-stress index with its week delta and flag counts. */}
              <div className="rounded-2xl border border-ink/10 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{LOAD_LABEL}</span>
                  <Link to="/history" className="rounded-full bg-paper px-3 py-1 text-[11px] font-semibold transition hover:bg-violet-50 hover:text-violet-700">
                    Detail
                  </Link>
                </div>
                <div className="mt-2">
                  <Gauge value={bodyIndex} max={100} color={r.hex} label={r.label} />
                  <p className="mt-2 text-center text-[11px] text-slate-soft">For comparing your own days — not a medical measurement.</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-ink/5 pt-3 text-center">
                  <div>
                    <div className="text-[11px] text-slate-soft">vs week start</div>
                    <div className="mt-0.5 text-lg font-extrabold" style={{ color: weekDelta > 0 ? RISK.caution.hex : weekDelta < 0 ? RISK.calm.hex : undefined }}>
                      {weekDelta > 0 ? '+' : ''}{weekDelta}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-soft">active flags</div>
                    <div className="mt-0.5 text-lg font-extrabold">{flags.length}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-soft">organs affected</div>
                    <div className="mt-0.5 text-lg font-extrabold">{new Set(flags.map((f) => f.organ)).size}</div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
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
                    className="block rounded-2xl border border-ink/10 bg-white p-3 transition hover:border-violet-300 hover:bg-violet-50/40"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: `${RISK[f.severity].hex}22`, color: RISK[f.severity].hex }}>
                        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{f.title}</span>
                        <span className="block text-xs text-slate-soft">{shortOrgan(f.organ)} · {RISK[f.severity].label}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-soft" aria-hidden="true" />
                    </span>
                    <FlagEvidence flag={f} items={items} className="mt-2.5 pl-[52px]" />
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
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
              <Link
                to="/summary"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-frost transition hover:bg-white/20"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Summary to show a pharmacist
              </Link>
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
