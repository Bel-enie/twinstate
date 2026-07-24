import { useEffect, useState } from 'react'
import { simulation } from '../../services/index.js'
import { RISK } from '../../utils/risk.js'
import { fmt, shortOrgan } from './twinData.js'
import { SeverityChip } from './Charts.jsx'
import { Delta } from './LiveTwin.jsx'

/**
 * The signature interaction: a question about your own data, answered from
 * your own data. Two questions trace a causal chain through what was logged;
 * the third runs the app's real What-If simulation (the same call the
 * dashboard makes), so "Simulating your twin…" is literally true.
 */

const HEDGE = 'This is an estimate from what was logged, not a medical diagnosis.'

function Chain({ steps }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-2">
          <span
            className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${
              s.severity ? '' : 'border-ink/10 bg-white'
            }`}
            style={
              s.severity
                ? { borderColor: `${RISK[s.severity].hex}66`, background: `${RISK[s.severity].hex}14` }
                : undefined
            }
          >
            {s.label}
            {s.sub && <span className="ml-1.5 text-xs font-normal text-slate-soft">{s.sub}</span>}
          </span>
          {i < steps.length - 1 && <span className="text-slate-soft" aria-hidden="true">→</span>}
        </li>
      ))}
    </ol>
  )
}

function BasedOn({ items }) {
  return (
    <div className="mt-5 border-t border-ink/10 pt-4 text-xs text-slate-soft">
      <span className="font-semibold">Based on:</span>{' '}
      {items.join(' · ')}
      <span className="mt-1 block">{HEDGE}</span>
    </div>
  )
}

export default function AskTwin({ story }) {
  const { persona, today, firstName } = story
  const liverFlag = today.state.flags.find((f) => f.id === 'paracetamol-overuse')
  const heartFlag = today.state.flags.find((f) => f.id === 'caffeine-stimulant-heart')

  const QUESTIONS = [
    { id: 'liver', text: `Why is my liver flagged?` },
    { id: 'future', text: 'What happens if I keep this up for 2 weeks?' },
    { id: 'tired', text: 'Why am I so tired?' },
  ]
  const [q, setQ] = useState('liver')

  // ── live What-If (real simulation call) ──
  const [sim, setSim] = useState(null)
  const [simulating, setSimulating] = useState(false)
  useEffect(() => {
    if (q !== 'future' || sim) return
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
    <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card sm:p-7">
      <div className="flex flex-wrap gap-2">
        {QUESTIONS.map((x) => (
          <button
            key={x.id}
            onClick={() => setQ(x.id)}
            aria-pressed={q === x.id}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              q === x.id ? 'border-ink bg-ink text-white' : 'border-ink/15 hover:border-ink/40'
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
              steps={[
                { label: 'Paracetamol', sub: `500 mg × ${today.paracetamol / 500}` },
                { label: `${fmt(today.paracetamol)} mg today`, sub: 'line ≈ 3,000' },
                { label: `${shortOrgan('liver')}: ${liverFlag.severity}`, severity: liverFlag.severity },
              ]}
            />
            <p className="mt-5 text-sm leading-relaxed">
              Your logged paracetamol reached <strong>{fmt(today.paracetamol)} mg</strong> today —
              at the line where the engine raises a liver flag, and close to the usual adult ceiling
              of 4,000 mg. Paracetamol is the driver here.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-soft">
              Cold-and-flu sachets often contain more paracetamol, so check labels before adding a
              dose. The headaches behind the doses may have more than one cause — {persona.profile.sleepHours} h of
              sleep and {fmt(today.caffeine)} mg of caffeine are both in the picture.
            </p>
            <BasedOn items={[`your last 7 days`, `rule “${liverFlag.title}”`, `${liverFlag.sources.map((s) => s.org).join(', ')} guidance`]} />
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
                  <div key={key} className="rounded-2xl border border-ink/10 bg-paper p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">{label}</span>
                      <SeverityChip severity={r.overall} />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold leading-none">{r.bodyIndex}</span>
                      <span className="text-xs text-slate-soft">in 2 weeks · from {today.bodyIndex} today</span>
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
              steps={[
                { label: 'Caffeine', sub: `${fmt(today.caffeine)} mg` },
                { label: 'Insomnia', sub: 'logged' },
                { label: `Sleep ≈ ${persona.profile.sleepHours} h` },
                { label: 'Fatigue', sub: 'logged', severity: 'watch' },
              ]}
            />
            <p className="mt-5 text-sm leading-relaxed">
              You logged <strong>insomnia and fatigue</strong> alongside about{' '}
              <strong>{persona.profile.sleepHours} hours of sleep</strong> and{' '}
              <strong>{fmt(today.caffeine)} mg of caffeine</strong> — well over the ~400 mg line. Caffeine
              and short sleep are the likely loop: the caffeine that keeps you up is what the tiredness
              is asking for the next day.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-soft">
              Exam stress and the headaches may also be contributing; the twin can only see what you
              logged.
            </p>
            <BasedOn items={['your logged symptoms and sleep', `rule “${heartFlag.title}”`, `${heartFlag.sources.map((s) => s.org).join(', ')} guidance`]} />
          </div>
        )}
      </div>
    </div>
  )
}
