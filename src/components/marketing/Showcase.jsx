import { useState } from 'react'
import { Meter, SeverityChip } from './Charts.jsx'

/**
 * The four "what the twin tells you" panels, shown one at a time beside the
 * feature accordion. Static illustrations of real product output: the flags
 * are genuine rules from mockData.js INTERACTION_RULES and every severity is
 * one the engine would actually assign.
 */

// ── Interaction report ────────────────────────────────────────────────────
const SAMPLE_FLAGS = [
  {
    severity: 'urgent',
    organ: 'Heart & circulation',
    title: 'Energy drinks on top of a prescribed stimulant',
    substances: ['Energy drink ×3', 'Prescribed stimulant'],
    reason:
      'Both push heart rate and blood pressure the same way. Stacked, they can cause palpitations and a racing heart that feels frightening at 2am.',
    safer: 'Keep the prescription, drop the energy drinks — not the other way round.',
  },
  {
    severity: 'caution',
    organ: 'Liver',
    title: 'Paracetamol adding up over the day',
    substances: ['Paracetamol 500mg ×6'],
    reason:
      'Individually fine. Across a day the total load is what the liver feels, and cold-and-flu sachets often hide more paracetamol on top.',
    safer: 'Check every sachet for paracetamol before adding another dose.',
  },
  {
    severity: 'watch',
    organ: 'Kidneys',
    title: 'Painkillers + dehydration straining kidneys',
    substances: ['Ibuprofen 400mg', 'Low fluid intake'],
    reason:
      'NSAIDs reduce blood flow to the kidneys. Dehydration does too — together the effect compounds.',
    safer: 'Water alongside the dose takes most of this risk away.',
  },
]

export function InteractionReport() {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-ink/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulseGlow rounded-full bg-risk-urgent" />
          <h3 className="font-bold">Interaction report</h3>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-slate-soft">
          3 findings
        </span>
      </div>

      <ul className="divide-y divide-ink/5">
        {SAMPLE_FLAGS.map((f) => (
          <li key={f.title} className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityChip severity={f.severity} />
              <span className="text-xs text-slate-soft">{f.organ}</span>
            </div>
            <p className="mt-2 font-bold leading-snug">{f.title}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {f.substances.map((s) => (
                <span key={s} className="rounded-md bg-paper px-2 py-0.5 text-[11px] text-slate-soft">
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-soft">{f.reason}</p>
            <p className="mt-2 flex gap-2 text-sm leading-relaxed">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-risk-calm" />
              <span>
                <span className="font-semibold">Safer:</span> {f.safer}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Weekly load ───────────────────────────────────────────────────────────
// Emphasis form: one hue, today highlighted, a labelled threshold — the
// severity bands are too close in hue to paint each bar by band.
const WEEK = [
  { day: 'Mon', value: 28 },
  { day: 'Tue', value: 35 },
  { day: 'Wed', value: 44 },
  { day: 'Thu', value: 58 },
  { day: 'Fri', value: 67 },
  { day: 'Sat', value: 61 },
  { day: 'Sun', value: 74 },
]
const CAUTION_AT = 58

export function WeeklyLoad() {
  const [hover, setHover] = useState(null)
  const last = WEEK.length - 1

  return (
    <div className="rounded-3xl border border-ink/5 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-bold">Weekly body-stress load</h3>
        <span className="text-xs text-slate-soft">0–100</span>
      </div>
      <p className="mt-1 text-sm text-slate-soft">
        One dose is rarely the problem. The pattern across a week is.
      </p>

      <div
        className="relative mt-6 h-44"
        role="img"
        aria-label="Body stress rising from 28 on Monday to 74 on Sunday, crossing the caution line of 58 on Thursday"
        onMouseLeave={() => setHover(null)}
      >
        {/* Threshold line */}
        <div
          className="absolute inset-x-0 z-0 flex items-center gap-2"
          style={{ bottom: `calc(${CAUTION_AT}% + ${20 - 0.2 * CAUTION_AT}px)` }}
        >
          <span className="text-[10px] font-semibold text-slate-soft">caution · {CAUTION_AT}</span>
          <div className="h-px flex-1 bg-ink/15" />
        </div>

        <div className="absolute inset-0 flex items-end gap-2">
          {WEEK.map((d, i) => {
            const isToday = i === last
            const isHover = hover === i
            return (
              <div
                key={d.day}
                className="relative flex h-full flex-1 flex-col justify-end"
                onMouseEnter={() => setHover(i)}
              >
                {(isToday || isHover) && (
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                      isHover && !isToday ? 'bg-ink text-white shadow-card' : 'text-ink'
                    }`}
                    style={{ bottom: `calc(${d.value}% + ${24 - 0.2 * d.value}px)` }}
                  >
                    {isHover && !isToday ? `${d.day} · ` : ''}
                    {d.value}
                  </span>
                )}
                <div className="flex h-[calc(100%-20px)] items-end">
                  <div
                    className={`mx-auto w-full max-w-[24px] rounded-t transition-colors ${
                      isToday ? 'bg-brand-500' : isHover ? 'bg-brand-400' : 'bg-brand-400/35'
                    }`}
                    style={{ height: `${d.value}%` }}
                  />
                </div>
                <span
                  className={`mt-1.5 h-[14px] text-center text-[11px] ${
                    isToday ? 'font-bold text-ink' : 'text-slate-soft'
                  }`}
                >
                  {d.day}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-4 border-t border-ink/5 pt-4 text-sm text-slate-soft">
        <span className="font-semibold text-ink">Sunday hit 74.</span> The climb is gradual, which
        is exactly why it's easy to miss until symptoms show up.
      </p>
    </div>
  )
}

// ── What-If ───────────────────────────────────────────────────────────────
export function WhatIfPreview() {
  const paths = [
    {
      key: 'continue',
      label: 'Keep this pattern',
      value: 88,
      severity: 'urgent',
      detail: 'Two more weeks at this rate pushes body stress to 88. The heart takes the most strain.',
    },
    {
      key: 'safer',
      label: 'Rest + hydrate',
      value: 31,
      severity: 'calm',
      detail: 'Cutting to one painkiller and less caffeine lets the organs recover. Same two weeks — very different twin.',
    },
  ]

  return (
    <div className="rounded-3xl border border-ink/5 bg-white p-5 shadow-soft sm:p-6">
      <h3 className="font-bold">What-If simulator</h3>
      <p className="mt-1 text-sm text-slate-soft">
        Two futures for the same body, projected over two weeks.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {paths.map((p) => (
          <div key={p.key} className="rounded-2xl border border-ink/5 bg-paper p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{p.label}</span>
              <SeverityChip severity={p.severity} />
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold leading-none">{p.value}</span>
              <span className="text-xs text-slate-soft">of 100</span>
            </div>
            <Meter value={p.value} max={100} severity={p.severity} className="mt-2.5" />
            <p className="mt-3 text-xs leading-relaxed text-slate-soft">{p.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Grounded chat ─────────────────────────────────────────────────────────
export function ChatPreview() {
  return (
    <div className="rounded-3xl border border-ink/5 bg-white p-5 shadow-soft sm:p-6">
      <h3 className="font-bold">Ask about your own data</h3>
      <p className="mt-1 text-sm text-slate-soft">
        Grounded in what you logged — not generic web answers.
      </p>

      <div className="mt-5 space-y-3">
        <div className="flex justify-end">
          <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-50 px-4 py-2.5 text-sm text-ink">
            Can I take another Panadol? My head is still pounding.
          </p>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-ink/5 bg-paper px-4 py-3">
            <p className="text-sm leading-relaxed">
              You've already logged <span className="font-semibold">6 × 500mg today</span> — that's
              3000mg, at the usual daily ceiling. Another dose would go over it, and your liver is
              already flagged.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-soft">
              If the headache isn't shifting, that's worth a clinic visit rather than more
              paracetamol.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['Paracetamol ×6', 'Liver: caution', 'Headache logged'].map((c) => (
                <span
                  key={c}
                  className="rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700"
                >
                  Grounded in {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-risk-urgent/20 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-risk-urgent" />
          Chest pain, trouble breathing, a possible overdose or self-harm skip the model entirely and
          show emergency guidance.
        </div>
      </div>
    </div>
  )
}
