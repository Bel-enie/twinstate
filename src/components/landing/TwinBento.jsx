import { useState } from 'react'
import { ArrowRight, Lock, Flame } from 'lucide-react'
import Twin3D from '../twin3d/index.jsx'
import { RISK } from '../../utils/risk.js'
import { BentoGrid, BentoCard } from './ui/BentoCard.jsx'
import NumberTicker from './ui/NumberTicker.jsx'
import SectionHeading from './ui/SectionHeading.jsx'
import Reveal from './ui/Reveal.jsx'
import { LOAD_LABEL, LOAD_NOTE, shortOrgan, fmt, weekFlags } from './twinData.js'

const SHOWN_ORGANS = ['heart', 'liver', 'brain']
const CAFFEINE_LINE = 400

/** Direction of a load number, where higher is worse. */
function Delta({ prev, cur }) {
  const diff = cur - prev
  const tone = diff > 0 ? RISK.caution.hex : diff < 0 ? RISK.calm.hex : '#96A3BD'
  return (
    <span className="inline-flex items-center gap-1 text-xs opacity-80">
      <span className="font-bold" style={{ color: tone }} aria-hidden="true">
        {diff > 0 ? '↑' : diff < 0 ? '↓' : '→'}
      </span>
      <span className="sr-only">{diff > 0 ? 'up' : diff < 0 ? 'down' : 'unchanged'}</span>
      {diff !== 0 && <span>{Math.abs(diff)}</span>}
    </span>
  )
}

/**
 * The product as a bento grid: the live twin in a dark 2x2 cell, with the
 * week's numbers, the change feed and the caffeine evidence around it. Every
 * figure is computed by the real rule engine from the persona's week —
 * the same code path the app runs.
 */
export default function TwinBento({ story, demoBusy, onDemo }) {
  const [organ, setOrgan] = useState(null)
  const { firstName, today, yesterday, first, weekDelta, headline, caffeineSources } = story
  const flagCount = today.state.flags.length
  const barMax = Math.max(CAFFEINE_LINE, ...caffeineSources.map((s) => s.mg), 1)

  return (
    <section id="twin" className="mx-auto max-w-[1200px] scroll-mt-24 px-5 py-20 sm:px-8">
      <SectionHeading
        eyebrow="Live demo"
        title="Not a mockup."
        gradientWord={`${firstName}'s real week.`}
        sub={`Everything below is recomputed by the app's rule engine from ${firstName}'s logged week — the flags, the numbers, the glowing organs. Click the body.`}
      />

      <Reveal delay={0.1} className="mt-12">
        <BentoGrid>
          {/* The twin — dark 2x2 cell */}
          <BentoCard dark className="lg:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-mist">
                  {firstName}'s twin
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] font-semibold text-mist">
                  <span className="h-1.5 w-1.5 rounded-full bg-risk-calm motion-safe:animate-pulseGlow" />
                  Live · {today.dateLabel}
                </span>
              </div>

              <div className="mt-4 grid flex-1 gap-5 sm:grid-cols-[minmax(200px,44%)_1fr]">
                <div className="stage-backdrop h-[280px] overflow-hidden rounded-[20px] sm:h-full sm:min-h-[320px]">
                  <Twin3D
                    organRisk={today.state.organRisk}
                    selected={organ}
                    onSelect={setOrgan}
                    showLabels={false}
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <div className="text-xs text-mist">{LOAD_LABEL}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <NumberTicker
                      value={today.bodyIndex}
                      className="text-6xl font-extrabold leading-none tracking-tight text-frost"
                    />
                    <span className="text-sm text-mist">of 100</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-mist">
                    <div className="flex items-center gap-1.5">
                      <Delta prev={yesterday.bodyIndex} cur={today.bodyIndex} /> since yesterday
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Delta prev={first.bodyIndex} cur={today.bodyIndex} /> this week
                    </div>
                  </div>

                  <div className="mt-4 text-sm font-semibold text-frost">
                    {flagCount} active flag{flagCount === 1 ? '' : 's'}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-hairline pt-3">
                    {SHOWN_ORGANS.map((k) => {
                      const sev = today.state.organRisk[k]?.severity || 'calm'
                      return (
                        <button
                          key={k}
                          onClick={() => setOrgan(organ === k ? null : k)}
                          aria-pressed={organ === k}
                          className={`rounded-[12px] px-2 py-1.5 text-left transition hover:bg-panel ${
                            organ === k ? 'bg-panel ring-1 ring-brand-400/40' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-[11px] text-mist">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: RISK[sev].hex }} />
                            {shortOrgan(k)}
                          </div>
                          <div className="mt-0.5 flex items-baseline gap-1.5 text-frost">
                            <span className="text-xl font-extrabold leading-none">{today.organ[k]}</span>
                            <Delta prev={yesterday.organ[k]} cur={today.organ[k]} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-3 text-[11px] leading-snug text-mist/80">{LOAD_NOTE}</p>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* This week in numbers */}
          <BentoCard>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">This week</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <NumberTicker
                  value={weekDelta}
                  signed
                  className="text-3xl font-extrabold tracking-tight"
                />
                <p className="mt-1 text-xs text-slate-soft">load vs start of week</p>
              </div>
              <div>
                <NumberTicker value={weekFlags(story).length} className="text-3xl font-extrabold tracking-tight" />
                <p className="mt-1 text-xs text-slate-soft">flags raised this week</p>
              </div>
              <div>
                <NumberTicker value={today.items.length} className="text-3xl font-extrabold tracking-tight" />
                <p className="mt-1 text-xs text-slate-soft">substances logged today</p>
              </div>
              <div>
                <NumberTicker value={story.days.length} className="text-3xl font-extrabold tracking-tight" />
                <p className="mt-1 text-xs text-slate-soft">days of history</p>
              </div>
            </div>
          </BentoCard>

          {/* What changed */}
          <BentoCard>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">What changed</p>
            <ol className="mt-4 space-y-3">
              {headline.map((c) => (
                <li key={`${c.date}-${c.title}`} className="grid grid-cols-[52px_1fr] gap-3">
                  <span className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">
                    {c.date}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: RISK[c.severity].hex }} />
                      {c.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-soft">{c.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </BentoCard>

          {/* Caffeine evidence */}
          <BentoCard>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" /> Caffeine today
            </p>
            <div className="mt-4 space-y-3">
              {caffeineSources.map((s) => (
                <div key={s.name}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-xs text-slate-soft">{fmt(s.mg)} mg · {s.detail}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/5">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#3A66D8,#8B5CF6,#D9467E)]"
                      style={{ width: `${Math.min(100, (s.mg / barMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-soft">
              Total {fmt(today.caffeine)} mg against the ~{fmt(CAFFEINE_LINE)} mg/day line — this is
              the evidence behind the heart flag, not a vibe.
            </p>
          </BentoCard>

          {/* Privacy */}
          <BentoCard>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Where your data lives
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-soft">
              Your log stays in this browser — there is no Twinstate server holding it. A first name
              is the whole sign-in, and you can delete a saved twin from this page any time.
            </p>
            <p className="mt-3 text-xs text-slate-soft/80">
              Educational demo, not medical advice or a diagnosis.
            </p>
          </BentoCard>

          {/* Demo CTA */}
          <BentoCard dark innerClassName="flex flex-col items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">Go deeper</p>
              <p className="mt-3 text-lg font-bold leading-snug text-frost">
                Open {firstName}'s full dashboard — history, what-if futures and the next step.
              </p>
            </div>
            <button
              onClick={onDemo}
              disabled={demoBusy}
              className="inline-flex items-center gap-2 rounded-full bg-frost px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-60"
            >
              {demoBusy ? 'Opening…' : 'Open the live demo'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </BentoCard>
        </BentoGrid>
      </Reveal>
    </section>
  )
}
