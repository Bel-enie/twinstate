import BrandMark from '../ui/BrandMark.jsx'
import EarlyAccessForm from './EarlyAccessForm.jsx'
import { RISK } from '../../utils/risk.js'
import { evidenceFor, fmt, shortOrgan, weekFlags } from './twinData.js'

/** Consistent rhythm down the scroll; `mood` tunes the background field. */
export function Section({ id, mood, children, className = '' }) {
  return (
    <section
      id={id}
      data-mood={mood}
      className={`mx-auto max-w-[1200px] scroll-mt-8 px-5 py-16 sm:px-8 sm:py-24 ${className}`}
    >
      {children}
    </section>
  )
}

export function Heading({ eyebrow, title, sub, center = false }) {
  return (
    <div
      className={`text-plate ${center ? 'text-plate-center mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}
    >
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
      )}
      <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-slate-soft sm:text-lg">{sub}</p>}
    </div>
  )
}

// ── Positioning ───────────────────────────────────────────────────────────
export function Positioning() {
  return (
    <Section className="!py-0">
      <div className="grid gap-6 border-y border-ink/10 py-8 sm:grid-cols-2 sm:gap-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-soft">Yesterday</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl">Health apps show your data.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Twinstate</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl">
            Builds a model of <em>you</em> from your data.
          </p>
        </div>
      </div>
    </Section>
  )
}

// ── Data fusion ───────────────────────────────────────────────────────────
const INPUTS = ['Prescriptions', 'Painkillers', 'Energy drinks', 'Supplements', 'Herbal tonics', 'Symptoms & sleep']

export function DataFusion() {
  const H = 300
  const W = 240
  const ys = INPUTS.map((_, i) => 24 + (i * (H - 48)) / (INPUTS.length - 1))
  return (
    <Section mood="trust">
      <Heading
        title={
          <>
            Your health data is fragmented. <em>Your body isn't.</em>
          </>
        }
        sub="Everything a student takes lives in different places — a prescription, a pharmacy receipt, a fridge, a memory. Twinstate puts it on one timeline and models how it affects you over time."
      />

      <div className="mt-12 grid items-center gap-6 md:grid-cols-[auto_240px_auto] md:justify-center md:gap-0">
        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
          {INPUTS.map((n) => (
            <li key={n} className="card-pearl rounded-[14px] px-4 py-2.5 text-sm font-semibold">
              {n}
            </li>
          ))}
        </ul>

        <svg viewBox={`0 0 ${W} ${H}`} className="hidden h-[300px] w-[240px] md:block" aria-hidden="true">
          {ys.map((y, i) => (
            <path
              key={i}
              d={`M0 ${y} C ${W * 0.45} ${y}, ${W * 0.55} ${H / 2}, ${W} ${H / 2}`}
              fill="none"
              stroke="#4B84F0"
              strokeOpacity="0.5"
              strokeWidth="1.5"
              className="stream"
            />
          ))}
          <circle cx={W} cy={H / 2} r="4" fill="#4B84F0" />
        </svg>

        <div className="card-pearl flex items-center gap-3 rounded-[22px] px-5 py-4">
          <BrandMark className="h-10 w-10" />
          <div>
            <div className="text-base font-extrabold tracking-tight">
              <span className="text-brand-600">Twin</span>
              <span className="text-risk-calm">state</span>
            </div>
            <div className="text-xs text-slate-soft">one model of your body</div>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center font-display text-2xl sm:text-3xl">
        One timeline. One model. One understanding of you.
      </p>
    </Section>
  )
}

// ── Not another dashboard: what changed, connected, in context ────────────
export function WhatChanged({ story }) {
  const { today, yesterday, days, firstName } = story
  const liverDay = days.find((d) => d.flagIds.includes('paracetamol-overuse'))
  const heartDay = days.find((d) => d.flagIds.includes('caffeine-stimulant-heart'))
  const cafPct = Math.round(((today.caffeine - yesterday.caffeine) / yesterday.caffeine) * 100)

  const cols = [
    {
      k: 'Something changed',
      body: (
        <>
          {firstName}'s logged caffeine {cafPct < 0 ? 'fell' : 'rose'} <strong>{Math.abs(cafPct)}%</strong> today —{' '}
          {fmt(yesterday.caffeine)} → {fmt(today.caffeine)} mg. The engine's heart load moved{' '}
          {yesterday.organ.heart} → {today.organ.heart} on the same day.
        </>
      ),
    },
    {
      k: 'Twinstate connects it',
      body: (
        <>
          The heart flag first appeared on <strong>{heartDay?.dateLabel}</strong> — the day logged caffeine
          crossed the ~400 mg line. The liver flag followed on <strong>{liverDay?.dateLabel}</strong>, when
          paracetamol reached {fmt(liverDay?.paracetamol || 0)} mg. Both totals rose over the same three days.
        </>
      ),
    },
    {
      k: 'Then gives context',
      body: (
        <>
          These are threshold rules, not a diagnosis: the heart number tracks caffeine; the liver flag
          tracks the paracetamol total. High caffeine intake is associated with poor sleep and a racing
          heart (FDA, EFSA) — and {story.persona.profile.sleepHours} h of sleep and exam stress could account
          for how {firstName} feels just as well. The twin can only see what was logged.
        </>
      ),
    },
  ]

  return (
    <Section mood="changed">
      <Heading
        eyebrow="Not another health dashboard"
        title={
          <>
            Don't just show me numbers. <em>Tell me what changed.</em>
          </>
        }
        sub="What changed? Why might that be? What should I pay attention to? Every twin answers those three in plain language — and says what it can't tell."
      />
      <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
        {cols.map((c, i) => (
          <div key={c.k} className="card-pearl rounded-[22px] px-5 py-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-soft">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] text-white">{i + 1}</span>
              {c.k}
            </div>
            <p className="mt-3 text-base leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ── Evidence ──────────────────────────────────────────────────────────────
export function Evidence({ story, flagId, onSelectFlag }) {
  const flags = weekFlags(story)
  const ev = evidenceFor(story, flagId)
  if (!ev) return null
  const { flag, measurements, total, unit, line, firstDay, daysPresent, activeToday } = ev

  return (
    <Section id="evidence" mood="evidence">
      <Heading
        eyebrow="Science"
        title={
          <>
            Every insight <em>has evidence.</em>
          </>
        }
        sub="Any flag, anywhere on this page, opens here: which records contributed, which rule fired, how sure the twin is, and when it started. Nothing on the twin is a black box."
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {flags.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelectFlag?.(f.id)}
            aria-pressed={f.id === flag.id}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              f.id === flag.id ? 'border-ink bg-ink text-white' : 'btn-glass border-transparent'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: RISK[f.severity].hex }} />
            {shortOrgan(f.organ)} · {f.title}
          </button>
        ))}
      </div>

      <div id="evidence-panel" className="card-pearl mt-5 rounded-[28px] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="h-2 w-2 rounded-full" style={{ background: RISK[flag.severity].hex }} />
          <h3 className="text-lg font-bold">{flag.title}</h3>
          <span className="text-sm text-slate-soft">
            · {shortOrgan(flag.organ)} · <span className="capitalize">{flag.severity}</span>
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-soft">{flag.reason}</p>

        <div className="mt-8 grid gap-8 md:grid-cols-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-soft">Measurements</h4>
            <ul className="mt-3 space-y-2">
              {measurements.map((m) => (
                <li key={`${m.name}-${m.detail}`} className="flex items-baseline justify-between gap-3 text-sm">
                  <span>
                    {m.name}
                    <span className="block text-[11px] text-slate-soft">{m.detail}</span>
                  </span>
                  {m.value != null && (
                    <span className="font-semibold tabular-nums">
                      {fmt(m.value)} {unit}
                    </span>
                  )}
                </li>
              ))}
              {total != null && (
                <li className="flex items-baseline justify-between border-t border-ink/10 pt-2 text-sm">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold tabular-nums">
                    {fmt(total)} {unit}
                  </span>
                </li>
              )}
              {line && <li className="text-[11px] text-slate-soft">Rule line: {line}</li>}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-soft">Sources</h4>
            <ul className="mt-3 space-y-2">
              {flag.sources.map((s) => (
                <li key={s.url} className="text-sm">
                  <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:text-brand-700">
                    {s.org}
                  </a>
                  <span className="block text-[11px] leading-snug text-slate-soft">{s.title}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-snug text-slate-soft">{flag.reference}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-soft">Confidence</h4>
            <p className="mt-3 text-sm leading-relaxed">
              <strong>Rule-based, deterministic.</strong> The same inputs always produce the same flag,
              and you can read the rule.
            </p>
            <p className="mt-2 text-[11px] leading-snug text-slate-soft">
              Where the app lets an AI estimate scores, it labels them <code>ai</code> and keeps the
              rule engine underneath as the floor.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-soft">Timeline</h4>
            <p className="mt-3 text-sm leading-relaxed">
              First appeared <strong>{firstDay?.dateLabel}</strong>. Present on{' '}
              <strong>
                {daysPresent.length} of {story.days.length}
              </strong>{' '}
              days this week; {activeToday ? `still active on ${story.today.dateLabel}` : 'not active today'}.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-ink/10 pt-4">
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">Safer alternative the twin suggests:</span>{' '}
            <span className="text-slate-soft">{flag.saferAlternative}</span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-soft">
            With a HOLON key, every substance you log resolves against HOLON's clinical concepts and the
            whole list is screened through its interaction knowledge base — severity, mechanism, clinical
            effect, management. Without one, the demo runs on a small, illustrative rule set that is
            labelled as simulated in the source.
          </p>
        </div>
      </div>
    </Section>
  )
}

// ── Trust ─────────────────────────────────────────────────────────────────
const TRUST_QA = [
  {
    q: 'Can Twinstate diagnose me?',
    a: "No. It explains what's known about the combinations you log and points you to care when something looks urgent. It doesn't diagnose and it never makes prescription decisions.",
  },
  {
    q: 'Who can access my data?',
    a: 'Nobody but you. There is no account server; your twin lives in your own browser. If you add a HOLON key, substance names are sent to HOLON to be resolved — no symptoms, no history.',
  },
  {
    q: 'Can I delete my data?',
    a: 'Yes, instantly. Remove a profile with the ✕ next to its name, or clear this site’s data in your browser. There is no copy anywhere else to ask us to delete.',
  },
  {
    q: 'Where do health insights come from?',
    a: 'From clinical drug-interaction knowledge (HOLON when configured; a labelled rule set otherwise), each flag citing its sources. Not from a model guessing.',
  },
  {
    q: 'Does AI train on my medical data?',
    a: 'By default no AI is involved at all — the engine is deterministic and runs in your browser. Only if you add your own OpenAI key or proxy are chat messages sent to that provider, under your own account.',
  },
]

export function Trust() {
  const box = 'card-pearl rounded-[14px] px-4 py-2.5 text-sm font-semibold'
  return (
    <Section id="trust" mood="trust">
      <Heading
        eyebrow="Security"
        title={
          <>
            Your health data <em>is yours.</em>
          </>
        }
        sub="For a health tool, trust isn't a supporting section — it's part of the product. Here is exactly what happens to what you log."
      />

      <div className="mt-12 grid items-center gap-4 md:grid-cols-[auto_1fr_auto_1fr_auto]">
        <ul className="space-y-2">
          {['What you log', 'How you slept', 'Your symptoms'].map((n) => (
            <li key={n} className={box}>
              {n}
            </li>
          ))}
        </ul>
        <div className="hidden h-px bg-ink/15 md:block" />
        <div className="rounded-[22px] border border-brand-100 bg-brand-50/80 px-5 py-4 text-center backdrop-blur">
          <div className="text-sm font-bold">This browser</div>
          <div className="mt-1 text-[11px] text-slate-soft">
            stored locally · no server
            <br />
            engine runs here
          </div>
        </div>
        <div className="hidden h-px bg-ink/15 md:block" />
        <div className="space-y-2">
          <div className={box}>Your twin</div>
          <div className="rounded-[14px] border border-dashed border-ink/20 px-4 py-2.5 text-[11px] text-slate-soft">
            Optional, with a key: substance <em>names</em> → HOLON → concept &amp; interaction data back
          </div>
        </div>
      </div>
      <div className="text-plate text-plate-center mx-auto mt-5 max-w-2xl">
        <p className="text-center text-sm text-slate-soft">
          You control access: leave and your twin stays, ✕ removes it, clearing site data erases it.
        </p>
      </div>

      <dl className="card-pearl mx-auto mt-14 max-w-3xl divide-y divide-ink/10 rounded-[28px] px-6 py-2 sm:px-10">
        {TRUST_QA.map((x) => (
          <div key={x.q} className="grid gap-2 py-5 sm:grid-cols-[1fr_1.6fr] sm:gap-8">
            <dt className="font-display text-xl">{x.q}</dt>
            <dd className="text-sm leading-relaxed text-slate-soft">{x.a}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────
export function FinalCta({ onBuild }) {
  return (
    <Section id="cta" mood="cta" className="text-center">
      <div className="text-plate text-plate-center mx-auto max-w-3xl">
        <h2 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
          Build a health record that actually <em>understands time.</em>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-slate-soft sm:text-lg">
          Two minutes to log what you take. A twin that keeps up from there.
        </p>
      </div>
      <button onClick={onBuild} className="btn-specular mt-8 rounded-[16px] px-7 py-3.5 text-base font-semibold">
        Build my twin
      </button>
    </Section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────
const FOOTER_COLS = [
  { h: 'Product', links: [['#product', 'Watch your week'], ['#ask', 'Ask your twin'], ['/faq', 'Health FAQ']] },
  { h: 'Science', links: [['#evidence', 'Evidence per insight'], ['#evidence', 'HOLON clinical knowledge']] },
  { h: 'Security', links: [['#trust', 'Where your data lives'], ['#trust', 'Delete your data']] },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="text-base font-extrabold tracking-tight">
              <span className="text-brand-600">Twin</span>
              <span className="text-risk-calm">state</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-soft">
            A living model of your body, built from what you take. Powered by Ontomorph DTP + HOLON.
          </p>
          <h3 className="mt-8 text-sm font-bold">Get early access</h3>
          <p className="mb-3 mt-1 max-w-sm text-xs text-slate-soft">
            Built at the Ontomorph Hackathon. Still being built. Leave your email and we'll tell you
            when it opens up properly.
          </p>
          <EarlyAccessForm />
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOTER_COLS.map((c) => (
            <div key={c.h}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-soft">{c.h}</h4>
              <ul className="mt-3 space-y-2">
                {c.links.map(([href, label]) => (
                  <li key={label}>
                    <a href={href} className="text-sm transition hover:text-brand-700">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 border-t border-ink/10 px-5 py-6 text-xs text-slate-soft sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>© 2026 Twinstate · OAU, Ontomorph Hackathon</span>
        <span className="max-w-xl sm:text-right">
          An educational tool, not a medical device. It does not diagnose or make prescription
          decisions. In an emergency, contact local emergency services.
        </span>
      </div>
    </footer>
  )
}
