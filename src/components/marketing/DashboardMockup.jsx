import AnatomyModel from '../anatomy/AnatomyModel.jsx'
import BrandMark from '../ui/BrandMark.jsx'
import { RISK } from '../../utils/risk.js'
import { Gauge, Meter, Sparkline, SeverityChip } from './Charts.jsx'

/**
 * The product mockup that overlaps the hero card — a static picture of the
 * dashboard for Beloved (the caffeine-overload persona), so it can't break in
 * a demo. The one live element is the 3D twin, which is the real component.
 *
 * Every number here is consistent with the engine's thresholds and with the
 * rest of the page (body-stress 74 = the "Sunday" point on the weekly chart).
 */

const TWIN_RISK = {
  heart: { severity: 'caution', flagCount: 1 },
  liver: { severity: 'caution', flagCount: 1 },
  brain: { severity: 'watch', flagCount: 1 },
  kidneys: { severity: 'calm', flagCount: 0 },
  stomach: { severity: 'calm', flagCount: 0 },
}

const ORGAN_ROWS = [
  ['heart', 'Heart'],
  ['liver', 'Liver'],
  ['brain', 'Brain'],
  ['kidneys', 'Kidneys'],
  ['stomach', 'Stomach'],
]

// Band thresholds, top → bottom, for the vertical scale beside the twin.
const SCALE = [
  ['urgent', '78'],
  ['caution', '58'],
  ['watch', '34'],
  ['calm', '0'],
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Beloved: 3 energy drinks (120mg) + 2 coffees (95mg) + 1 caffeine pill (200mg).
const CAFFEINE = [310, 380, 420, 455, 530, 610, 750]

const TILES = [
  {
    label: 'Caffeine today',
    value: '750',
    unit: 'mg',
    severity: 'caution',
    chip: 'High',
    body: <Sparkline points={CAFFEINE} labels={DAYS} unit=" mg" />,
    foot: 'Up from 310 mg on Monday',
  },
  {
    label: 'Paracetamol today',
    value: '3,000',
    unit: 'mg',
    severity: 'watch',
    chip: 'Near limit',
    body: <Meter value={3000} max={4000} severity="watch" />,
    foot: 'Daily ceiling 4,000 mg',
  },
  {
    label: 'Sleep last night',
    value: '4.5',
    unit: 'h',
    severity: 'caution',
    chip: 'Low',
    body: <Meter value={4.5} max={8} severity="caution" />,
    foot: 'Target 8 h',
  },
  {
    label: 'Water today',
    value: '0.8',
    unit: 'L',
    severity: 'watch',
    chip: 'Low',
    body: <Meter value={0.8} max={2} severity="watch" />,
    foot: 'Target 2 L',
  },
]

const STEPS = [
  {
    stage: 'Monitor',
    when: 'Today',
    glyph: '◎',
    items: ['Swap the third energy drink for water', 'Cap paracetamol at 4 × 500 mg'],
  },
  {
    stage: 'Clinic soon',
    when: 'This week',
    glyph: '+',
    items: ['If the headache outlasts the exams, book the campus clinic'],
  },
  {
    stage: 'Track',
    when: 'Ongoing',
    glyph: '↻',
    items: ['Log each dose — the twin recalculates as you go'],
  },
]

const TABS = ['Twin', 'History', 'What-If', 'Chat']

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M5 8a5 5 0 0 1 10 0c0 3 1 4.5 1.5 5.5H3.5C4 12.5 5 11 5 8Z" strokeLinejoin="round" />
      <path d="M8.5 16a1.5 1.5 0 0 0 3 0" strokeLinecap="round" />
    </svg>
  )
}

export default function DashboardMockup() {
  return (
    <div className="rounded-[1.6rem] bg-white p-2.5 text-ink shadow-shell ring-1 ring-ink/5 sm:p-3">
      {/* ── App top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-2">
          <BrandMark className="h-6 w-6 rounded-lg" />
          <span className="text-sm font-extrabold tracking-tight">
            <span className="text-brand-500">Twin</span>
            <span className="text-risk-calm">state</span>
          </span>
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-ink/5 bg-paper p-1 sm:flex">
          {TABS.map((t, i) => (
            <span
              key={t}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                i === 0 ? 'bg-ink text-white' : 'text-slate-soft'
              }`}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-slate-soft">
          <span className="relative grid h-7 w-7 place-items-center rounded-full border border-ink/5">
            <BellIcon />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-risk-caution" />
          </span>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-rose-200 to-pink-300 text-[11px] font-bold text-ink">
            B
          </span>
        </div>
      </div>

      <div className="mt-1.5 grid gap-2.5 lg:grid-cols-[1.5fr_1fr]">
        {/* ── A. The twin ──────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-deep p-3 text-frost">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Beloved's twin</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-mist">
              Exam week · day 5
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-[76px_1fr_auto] items-stretch gap-2">
            <div className="flex flex-col gap-1.5">
              {ORGAN_ROWS.map(([key, name]) => {
                const sev = TWIN_RISK[key].severity
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-2 py-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: RISK[sev].hex }} />
                      <span className="text-[11px] font-semibold">{name}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] capitalize text-mist">{sev}</div>
                  </div>
                )
              })}
            </div>

            <div className="stage-backdrop h-[250px] overflow-hidden rounded-xl sm:h-[280px]">
              <AnatomyModel organRisk={TWIN_RISK} compact />
            </div>

            <div className="flex flex-col justify-between py-1">
              {SCALE.map(([sev, at]) => (
                <div key={sev} className="flex items-center gap-1.5">
                  <span
                    className="h-full min-h-[44px] w-1.5 rounded-full sm:min-h-[52px]"
                    style={{ background: RISK[sev].hex }}
                  />
                  <span className="w-5 text-[10px] tabular-nums text-mist">{at}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── B. Insights + gauge ──────────────────────────────────────── */}
        <div className="flex flex-col rounded-2xl bg-deep p-3 text-frost">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Twin insights</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-mist">
              This week
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5">
              <div className="text-[11px] text-mist">Interactions</div>
              <div className="mt-1 text-xl font-extrabold leading-none">3</div>
              <div className="mt-2 flex flex-wrap gap-1">
                <SeverityChip severity="caution" label="2 caution" dark />
                <SeverityChip severity="watch" label="1 watch" dark />
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5">
              <div className="text-[11px] text-mist">Worst organ</div>
              <div className="mt-1 text-xl font-extrabold leading-none">Heart</div>
              <div className="mt-2">
                <Meter value={74} max={100} severity="caution" dark />
              </div>
              <div className="mt-1.5 text-[10px] text-mist">Stimulant load, 3 sources</div>
            </div>
          </div>

          <div className="mt-3 flex flex-1 flex-col justify-end">
            <div className="text-center text-[11px] text-mist">Body-stress index · of 100</div>
            <div className="mt-1">
              <Gauge value={74} dark />
            </div>
          </div>
        </div>

        {/* ── C. Stat tiles ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          {TILES.map((t) => (
            <div key={t.label} className="rounded-2xl border border-ink/5 bg-white p-3 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="text-[11px] text-slate-soft">{t.label}</span>
                <SeverityChip severity={t.severity} label={t.chip} />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold leading-none">{t.value}</span>
                <span className="text-xs text-slate-soft">{t.unit}</span>
              </div>
              <div className="mt-2.5">{t.body}</div>
              <div className="mt-1.5 text-[10px] text-slate-soft">{t.foot}</div>
            </div>
          ))}
        </div>

        {/* ── D. Next steps ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-ink/5 bg-white p-3 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Suggested next steps</span>
            <span className="text-[11px] font-semibold text-brand-600">Create plan +</span>
          </div>
          <ul className="mt-2.5 space-y-2.5">
            {STEPS.map((s) => (
              <li key={s.stage} className="flex gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink/5 bg-paper text-xs text-slate-soft">
                  {s.glyph}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{s.stage}</span>
                    <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-slate-soft">
                      {s.when}
                    </span>
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {s.items.map((it) => (
                      <li key={it} className="flex gap-1.5 text-[11px] leading-snug text-slate-soft">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-ink/25" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
