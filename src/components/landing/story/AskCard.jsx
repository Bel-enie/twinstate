import { useEffect, useState } from 'react'
import { simulation } from '../../../services/index.js'
import { RISK } from '../../../utils/risk.js'
import StoryCard from '../ui/StoryCard.jsx'
import SeverityChip from '../ui/SeverityChip.jsx'
import Delta from '../ui/Delta.jsx'
import { LOAD_LABEL, fmt, shortOrgan } from '../twinData.js'

/**
 * "Ask your twin." A question about your own data, answered from your own
 * data. Two answers lay out what was logged in order; the third runs the real
 * What-If simulation. Claims stay at the level of what the rules measure —
 * never a diagnosis, never a proven cause.
 */
const HEDGE = 'An estimate from what was logged, not a medical diagnosis.'
const QUESTIONS = [
  { id: 'liver', text: 'Why is my liver flagged?' },
  { id: 'future', text: 'What if I keep this up for 2 weeks?' },
  { id: 'tired', text: 'Why am I so tired?' },
]

function Chain({ steps, caption }) {
  return (
    <div>
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${s.severity ? '' : 'border-ink/10 bg-paper'}`}
              style={s.severity ? { borderColor: `${RISK[s.severity].hex}66`, background: `${RISK[s.severity].hex}14` } : undefined}
            >
              {s.label}
              {s.sub && <span className="ml-1.5 text-xs font-normal text-slate-soft">{s.sub}</span>}
            </span>
            {i < steps.length - 1 && (
              <span className="text-violet-400" aria-hidden="true">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      {caption && <p className="mt-2 text-[11px] text-slate-soft">{caption}</p>}
    </div>
  )
}

function BasedOn({ items }) {
  return (
    <div className="mt-6 border-t border-ink/10 pt-4 text-xs text-slate-soft">
      <span className="font-semibold">Based on:</span> {items.join(' · ')}
      <span className="mt-1 block">{HEDGE}</span>
    </div>
  )
}

export default function AskCard({ story }) {
  const { persona, today, firstName } = story
  const liverFlag = today.state.flags.find((f) => f.id === 'paracetamol-overuse')
  const heartFlag = today.state.flags.find((f) => f.id === 'caffeine-stimulant-heart')
  const [q, setQ] = useState('future')
  const [sim, setSim] = useState(null)
  const [simError, setSimError] = useState(false)

  // The real simulation, run once when its question is first opened.
  useEffect(() => {
    if (q !== 'future' || sim || simError) return undefined
    let alive = true
    simulation
      .simulate({ organRisk: today.state.organRisk, items: today.items, weeks: 2 })
      .then((res) => alive && setSim(res))
      .catch(() => alive && setSimError(true))
    return () => {
      alive = false
    }
  }, [q, sim, simError, today])

  return (
    <StoryCard
      n={3}
      eyebrow="Ask your twin"
      title="Not a chat box."
      gradient="Answers from your own data."
      sub="Ask about something you logged and the twin answers from that log, and simulates it when the answer lies in the future."
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Questions">
        {QUESTIONS.map((x) => (
          <button
            key={x.id}
            onClick={() => setQ(x.id)}
            aria-pressed={q === x.id}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              q === x.id
                ? 'bg-brand-grad text-white shadow-[0_8px_22px_-10px_rgba(124,92,240,0.7)]'
                : 'border border-ink/15 bg-white text-ink hover:border-violet-300'
            }`}
          >
            “{x.text}”
          </button>
        ))}
      </div>

      <div className="mt-6" aria-live="polite">
        {q === 'liver' && liverFlag && (
          <div>
            <Chain
              caption="What the rule measures, in order."
              steps={[
                { label: 'Paracetamol', sub: `${fmt(today.paracetamol)} mg today` },
                { label: 'Rule line', sub: '≈ 3,000 mg/day' },
                { label: `${shortOrgan('liver')} · ${liverFlag.severity}`, severity: liverFlag.severity },
              ]}
            />
            <p className="mt-5 max-w-3xl text-sm leading-relaxed">
              {firstName}'s logged paracetamol reached <strong>{fmt(today.paracetamol)} mg</strong> today: the line
              where the engine raises a liver flag, and close to the usual adult ceiling of 4,000 mg. The flag is
              about that total alone; nothing else in the log feeds it.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-soft">
              Cold-and-flu sachets often contain more paracetamol, so check labels before adding a dose.
            </p>
            <BasedOn items={['the last 7 days', `rule “${liverFlag.title}”`, `${liverFlag.sources.map((s) => s.org).join(', ')} guidance`]} />
          </div>
        )}

        {q === 'future' && (
          <div>
            {simError ? (
              <p className="py-6 text-sm text-slate-soft">The simulation couldn't run just now. Try another question.</p>
            ) : !sim ? (
              <div className="flex items-center gap-3 py-6 text-sm text-slate-soft">
                <span className="h-2 w-2 rounded-full bg-violet-500 motion-safe:animate-pulseGlow" />
                Simulating {firstName}'s twin…
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: 'continue', label: 'Keep this pattern', r: sim.continue },
                  { key: 'safer', label: 'Rest, hydrate, one painkiller', r: sim.safer },
                ].map(({ key, label, r }) => (
                  <div key={key} className="rounded-3xl border border-ink/10 bg-paper/60 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">{label}</span>
                      <SeverityChip severity={r.overall} />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-5xl font-extrabold leading-none tracking-[-0.03em]">{r.bodyIndex}</span>
                      <span className="text-xs text-slate-soft">
                        {LOAD_LABEL.toLowerCase()} in 2 weeks · from {today.bodyIndex} today
                      </span>
                    </div>
                    <ul className="mt-4 space-y-1.5">
                      {['heart', 'liver', 'brain'].map((k) => (
                        <li key={k} className="flex items-center justify-between text-sm">
                          <span className="text-slate-soft">{shortOrgan(k)}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-semibold">{r.organStress[k]}</span>
                            <Delta prev={today.organ[k]} cur={r.organStress[k]} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <BasedOn items={['the last 7 days', 'the interaction engine’s projection', 'two weeks ahead']} />
          </div>
        )}

        {q === 'tired' && heartFlag && (
          <div>
            <Chain
              caption="A pattern in the log, not a proven chain."
              steps={[
                { label: 'Caffeine', sub: `${fmt(today.caffeine)} mg`, severity: heartFlag.severity },
                { label: 'Insomnia', sub: 'logged' },
                { label: `Sleep ≈ ${persona.profile.sleepHours} h` },
                { label: 'Fatigue', sub: 'logged' },
              ]}
            />
            <p className="mt-5 max-w-3xl text-sm leading-relaxed">
              {firstName} logged <strong>insomnia and fatigue</strong> alongside about{' '}
              <strong>{persona.profile.sleepHours} hours of sleep</strong> and{' '}
              <strong>{fmt(today.caffeine)} mg of caffeine</strong>, well over the ~400 mg line. High caffeine is
              associated with disrupted sleep, and short sleep with daytime tiredness (FDA and EFSA guidance).
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-soft">
              It's an association, not a proof. Exam stress could explain it just as well, and the twin can only see
              what was logged.
            </p>
            <BasedOn items={['logged symptoms and sleep', `rule “${heartFlag.title}”`, `${heartFlag.sources.map((s) => s.org).join(', ')} guidance`]} />
          </div>
        )}
      </div>
    </StoryCard>
  )
}
