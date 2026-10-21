import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Download, Lock, Flame, Moon, Trash2 } from 'lucide-react'
import { deleteAllData, exportAllData, hasStoredData, privacyLine } from '../../services/privacy.js'
import { RISK } from '../../utils/risk.js'
import { BentoGrid, BentoCard } from './ui/BentoCard.jsx'
import NumberTicker from './ui/NumberTicker.jsx'
import SectionHeading from './ui/SectionHeading.jsx'
import Reveal from './ui/Reveal.jsx'
import { fmt, weekFlags } from './twinData.js'
import { SYMPTOMS } from '../../services/mock/mockData.js'

const CAFFEINE_LINE = 400

/**
 * The week in numbers, as a bento grid: summary stats, the change feed, the
 * caffeine evidence, sleep and symptoms, privacy, and the way into the demo.
 * The live twin itself sits in the hero now, so it is not repeated here.
 */
export default function TwinBento({ story, demoBusy, onDemo }) {
  const { persona, firstName, today, weekDelta, headline, caffeineSources } = story
  const barMax = Math.max(CAFFEINE_LINE, ...caffeineSources.map((s) => s.mg), 1)
  const [canManage] = useState(() => hasStoredData())
  const symptomLabels = (persona.symptoms || [])
    .map((id) => SYMPTOMS.find((s) => s.id === id)?.label || id)
    .slice(0, 4)

  return (
    <section id="twin" className="mx-auto max-w-[1200px] scroll-mt-24 px-5 py-20 sm:px-8">
      <SectionHeading
        eyebrow="Live demo"
        title={`${firstName}'s week,`}
        gradientWord="in numbers."
        sub={`What changed, the evidence behind each flag, and what the twin knows about ${firstName}'s sleep and symptoms, all computed by the app's rule engine from the log. Then open the real dashboard.`}
      />

      <Reveal delay={0.1} className="mt-12">
        <BentoGrid>
          {/* This week in numbers */}
          <BentoCard>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">This week</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <NumberTicker value={weekDelta} signed className="font-display text-3xl font-extrabold tracking-tight" />
                <p className="mt-1 text-xs text-slate-soft">load vs start of week</p>
              </div>
              <div>
                <NumberTicker value={weekFlags(story).length} className="font-display text-3xl font-extrabold tracking-tight" />
                <p className="mt-1 text-xs text-slate-soft">flags raised this week</p>
              </div>
              <div>
                <NumberTicker value={today.items.length} className="font-display text-3xl font-extrabold tracking-tight" />
                <p className="mt-1 text-xs text-slate-soft">substances logged today</p>
              </div>
              <div>
                <NumberTicker value={story.days.length} className="font-display text-3xl font-extrabold tracking-tight" />
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
                  <span className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">{c.date}</span>
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
              Total {fmt(today.caffeine)} mg against the ~{fmt(CAFFEINE_LINE)} mg/day line. This is the
              evidence behind the heart flag, not a vibe.
            </p>
          </BentoCard>

          {/* Sleep and symptoms */}
          <BentoCard>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              <Moon className="h-3.5 w-3.5" aria-hidden="true" /> Sleep &amp; symptoms
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <NumberTicker value={persona.profile?.sleepHours ?? 0} className="font-display text-3xl font-extrabold tracking-tight" />
              <span className="text-xs text-slate-soft">hours of sleep · stress {persona.profile?.stress || 'unknown'}</span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {symptomLabels.map((label) => (
                <li key={label} className="rounded-full border border-ink/10 bg-paper px-2.5 py-1 text-xs font-semibold">
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-soft">
              Logged alongside the substances, so a "symptom" can be matched to what might be causing it.
            </p>
          </BentoCard>

          {/* Privacy */}
          <BentoCard>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Where your data lives
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-soft">
              {privacyLine()} A first name is the whole sign-in.
            </p>
            {canManage && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={exportAllData} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold transition hover:border-violet-300 hover:text-violet-700">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export my data
                </button>
                <button onClick={deleteAllData} className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete everything
                </button>
              </div>
            )}
            <Link to="/limits" className="mt-3 inline-block text-xs font-semibold text-violet-600 hover:underline">
              How it works and what it can’t do →
            </Link>
            <p className="mt-3 text-xs text-slate-soft/80">Educational demo, not medical advice or a diagnosis.</p>
          </BentoCard>

          {/* Demo CTA */}
          <BentoCard dark innerClassName="flex flex-col items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">Go deeper</p>
              <p className="mt-3 text-lg font-bold leading-snug text-frost">
                Open {firstName}'s full dashboard: history, what-if futures and the next step.
              </p>
            </div>
            <button
              onClick={onDemo}
              disabled={demoBusy}
              className="inline-flex items-center gap-2 rounded-full bg-frost px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-60"
            >
              {demoBusy ? 'Opening…' : 'Open the live demo'}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </BentoCard>
        </BentoGrid>
      </Reveal>
    </section>
  )
}
