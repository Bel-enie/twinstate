import { useEffect, useState } from 'react'
import { simulation } from '../../services/index.js'
import { RISK } from '../../utils/risk.js'
import { LOAD_LABEL, fmt, shortOrgan } from './twinData.js'
import { SeverityChip } from './Charts.jsx'
import { Delta } from './LiveTwin.jsx'

/**
 * The signature interaction: a question about your own data, answered from
 * your own data. Two questions lay out what was logged in order; the third
 * runs the app's real What-If simulation (the same call the dashboard makes),
 * so "Simulating your twin…" is literally true. Claims stay at the level of
 * what the rules measure and what the cited guidance associates — never a
 * diagnosis, never a proven cause.
 */

const HEDGE = 'An estimate from what was logged, not a medical diagnosis.'

function Chain({ steps, caption, onSelectFlag }) {
  return (
    <div>
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => {
          const Tag = s.flagId ? 'button' : 'span'
          return (
            <li key={s.label} className="flex items-center gap-2">
              <Tag
                onClick={s.flagId ? () => onSelectFlag?.(s.flagId) : undefined}
                className={`rounded-[12px] border px-3 py-1.5 text-sm font-semibold ${
                  s.severity ? '' : 'border-ink/10 bg-white/70'
                } ${s.flagId ? 'transition hover:-translate-y-px' : ''}`}
                style={
                  s.severity
                    ? { borderColor: `${RISK[s.severity].hex}66`, background: `${RISK[s.severity].hex}14` }
                    : undefined
                }
              >
                {s.label}
                {s.sub && <span className="ml-1.5 text-xs font-normal text-slate-soft">{s.sub}</span>}
                {s.flagId && <span className="ml-1.5 text-[11px] text-brand-600">evidence →</span>}
              </Tag>
              {i < steps.length - 1 && <span className="text-slate-soft" aria-hidden="true">→</span>}
            </li>
          )
        })}
      </ol>
      {caption && <p className="mt-2 text-[11px] text-slate-soft">{caption}</p>}
    </div>
  )
}

function BasedOn({ items }) {
  return (
    <div className="mt-5 border-t border-ink/10 pt-4 text-xs text-slate-soft">
      <span className="font-semibold">Based on:</span> {items.join(' · ')}
      <span className="mt-1 block">{HEDGE}</span>
    </div>
  )
}

export default function AskTwin({ story, onSelectFlag }) {
  const { persona, today, firstName } = story
  const liverFlag = today.state.flags.find((f) => f.id === 'paracetamol-overuse')
  const heartFlag = today.state.flags.find((f) => f.id === 'caffeine-stimulant-heart')

  const QUESTIONS = [
    { id: 'liver', text: 'Why is my liver flagged?' },
    { id: 'future', text: 'What happens if I keep this up for 2 weeks?' },
    { id: 'tired', text: 'Why am I so tired?' },
  ]
  const [q, setQ] = useState('liver')

  // ── live What-If (real simulation call) ──
  const [sim, setSim] = useState(null)
  const [simulating, setSimulating] = useState(false)
  useEffect(() => {
    if (q !== 'future' || sim) return undefined
    let alive = true
    setSimulating(true)
    simulation
      .simulate({ organRisk: today.state.organRisk, items: today.items, weeks: 2 })
      .then((res) => alive && setSim(res))
      .finally(() => alive && setSimulating(false))
    return () => {
      alive = false
    }
  }, [q, sim, today])

  return (
    <div className="card-glass rounded-[28px] p-5 sm:p-7">
      <div className="flex flex-wrap gap-2">
        {QUESTIONS.map((x) => (
          <button
            key={x.id}
            onClick={() => setQ(x.id)}
            aria-pressed={q === x.id}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              q === x.id ? 'border-ink bg-ink text-white' : 'btn-glass border-transparent'
            }`}
          >
            “{x.text}”
          </button>
        ))}
      </div>

      <div className="mt-6">
        {q === 'liver' && liverFlag && (
          <div>
            <Chain
              onSelectFlag={onSelectFlag}
              caption="What the rule measures, in order."
              steps={[
                { label: 'Paracetamol', sub: `${fmt(today.paracetamol)} mg logged today` },
                { label: 'Rule line', sub: '≈ 3,000 mg/day' },
                { label: `${shortOrgan('liver')} · ${liverFlag.severity}`, severity: liverFlag.severity, flagId: liverFlag.id },
              ]}
            />
            <p className="mt-5 text-sm leading-relaxed">
              Your logged paracetamol reached <strong>{fmt(today.paracetamol)} mg</strong> today —
              the line where the engine raises a liver flag, and close to the usual adult ceiling of
              4,000 mg. The flag is about that total alone; nothing else you logged feeds it.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-soft">
              Cold-and-flu sachets often contain more paracetamol, so check labels before adding a
              dose. Why the headaches are there in the first place is a separate question —{' '}
              {persona.profile.sleepHours} h of sleep and {fmt(today.caffeine)} mg of caffeine are both in the log.
            </p>
            <BasedOn items={['your last 7 days', `rule “${liverFlag.title}”`, `${liverFlag.sources.map((s) => s.org).join(', ')} guidance`]} />
          </div>
        )}

        {q === 'future' && (
          <div aria-live="polite">
            {simulating || !sim ? (
              <div className="flex items-center gap-3 py-6 text-sm text-slate-soft">
                <span className="h-2 w-2 animate-pulseGlow rounded-full bg-brand-500" />
                Simulating {firstName}'s twin…
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: 'continue', label: 'Keep this pattern', r: sim.continue },
                  { key: 'safer', label: 'Rest, hydrate, one painkiller', r: sim.safer },
                ].map(({ key, label, r }) => (
                  <div key={key} className="card-inset rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">{label}</span>
                      <SeverityChip severity={r.overall} />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold leading-none">{r.bodyIndex}</span>
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
            <BasedOn items={['your last 7 days', 'the interaction engine’s projection', 'two weeks ahead']} />
          </div>
        )}

        {q === 'tired' && heartFlag && (
          <div>
            <Chain
              onSelectFlag={onSelectFlag}
              caption="A pattern in the log, not a proven chain."
              steps={[
                { label: 'Caffeine', sub: `${fmt(today.caffeine)} mg`, severity: heartFlag.severity, flagId: heartFlag.id },
                { label: 'Insomnia', sub: 'logged' },
                { label: `Sleep ≈ ${persona.profile.sleepHours} h` },
                { label: 'Fatigue', sub: 'logged' },
              ]}
            />
            <p className="mt-5 text-sm leading-relaxed">
              You logged <strong>insomnia and fatigue</strong> alongside about{' '}
              <strong>{persona.profile.sleepHours} hours of sleep</strong> and{' '}
              <strong>{fmt(today.caffeine)} mg of caffeine</strong> — well over the ~400 mg line. High
              caffeine intake is associated with disrupted sleep, and short sleep with daytime
              tiredness (FDA and EFSA guidance). That pattern matches what you logged.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-soft">
              It's an association, not a proof. Exam stress and the headaches could explain it just
              as well, and the twin can only see what you logged.
            </p>
            <BasedOn items={['your logged symptoms and sleep', `rule “${heartFlag.title}”`, `${heartFlag.sources.map((s) => s.org).join(', ')} guidance`]} />
          </div>
        )}
      </div>
    </div>
  )
}
