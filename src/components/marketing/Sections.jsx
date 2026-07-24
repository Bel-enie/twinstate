import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../ui/BrandMark.jsx'
import EarlyAccessForm from './EarlyAccessForm.jsx'
import { InteractionReport, WeeklyLoad, WhatIfPreview, ChatPreview } from './Showcase.jsx'
import { useTwin } from '../../context/TwinContext.jsx'
import { PERSONAS, ORGANS } from '../../services/mock/mockData.js'
import { RISK } from '../../utils/risk.js'

/** Consistent horizontal rhythm for every section down the scroll. */
export function Section({ id, children, className = '' }) {
  return (
    <section id={id} className={`mx-auto max-w-[1200px] scroll-mt-6 px-5 sm:px-8 ${className}`}>
      {children}
    </section>
  )
}

/** Editorial heading pair used by every light section. */
function Heading({ title, sub, center = false }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <h2 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-3 text-base leading-relaxed text-slate-soft sm:text-lg">{sub}</p>}
    </div>
  )
}

// ── 1. The stacking problem ───────────────────────────────────────────────
const STACK = [
  {
    t: 'The stack is invisible',
    d: 'Paracetamol for the headache, three energy drinks for the all-nighter, a herbal "detox" tonic — each feels harmless alone.',
  },
  {
    t: 'The risk is cumulative',
    d: "It's not one dose, it's the pattern over a week. Livers, kidneys and hearts feel the total.",
  },
  {
    t: 'Nobody explains it simply',
    d: 'Interaction checkers read like a pharmacology exam. Your twin explains it like a friend who happens to know medicine.',
  },
]

export function ProblemStrip() {
  return (
    <Section className="pb-16 pt-36 sm:pb-20 sm:pt-44 lg:pt-60">
      <Heading
        title={
          <>
            Nobody sets out to take <em>six painkillers</em> in a day.
          </>
        }
        sub="It happens one reasonable decision at a time, across a week nobody is counting."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {STACK.map((c, i) => (
          <div key={c.t} className="rounded-3xl border border-ink/5 bg-white p-6 shadow-card">
            <span className="text-xs font-semibold text-slate-soft">0{i + 1}</span>
            <h3 className="mt-2 font-display text-2xl">{c.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-soft">{c.d}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ── 2. Insights: accordion + swapping panel ───────────────────────────────
const FEATURES = [
  {
    t: 'See the interaction, not just a score',
    d: 'Every flagged combination is explained in plain language — what, why, and the safer swap — with the organ it lands on.',
    glyph: '◎',
    panel: <InteractionReport />,
  },
  {
    t: 'Watch the week, not the dose',
    d: 'The twin keeps a running body-stress index across seven days, so a gradual climb is visible before it becomes a symptom.',
    glyph: '∿',
    panel: <WeeklyLoad />,
  },
  {
    t: 'Try the safer path before you live it',
    d: 'Two futures for the same body — keep going, or rest and hydrate — projected over the coming weeks.',
    glyph: '⇄',
    panel: <WhatIfPreview />,
  },
  {
    t: 'Ask about your own data',
    d: 'A health chat grounded in what you logged, with a hard rule that routes anything urgent to real care.',
    glyph: '?',
    panel: <ChatPreview />,
  },
]

export function InsightsSection() {
  const [open, setOpen] = useState(0)

  return (
    <Section id="how" className="pb-16 sm:pb-20">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div>
          <Heading
            title={
              <>
                Plain answers for a <em>stressed</em> student.
              </>
            }
            sub="Not a risk score with no explanation — a report you can act on, a pattern over time, and two futures to choose between."
          />

          <ul className="mt-8 divide-y divide-ink/10 border-t border-ink/10">
            {FEATURES.map((f, i) => {
              const isOpen = open === i
              return (
                <li key={f.t}>
                  <button
                    onClick={() => setOpen(i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start gap-4 py-5 text-left"
                  >
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/10 bg-white text-sm text-slate-soft shadow-card">
                      {f.glyph}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-display text-2xl leading-tight">{f.t}</span>
                        <span className="shrink-0 text-lg leading-none text-slate-soft" aria-hidden="true">
                          {isOpen ? '−' : '+'}
                        </span>
                      </span>
                      {isOpen && (
                        <span className="mt-2 block text-sm leading-relaxed text-slate-soft">{f.d}</span>
                      )}
                    </span>
                  </button>
                  {isOpen && <div className="mb-1 h-0.5 w-16 rounded-full bg-brand-500" />}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">{FEATURES[open].panel}</div>
      </div>
    </Section>
  )
}

// ── 3. Stats bento — honest facts about how it's built ────────────────────
// Matches the mockup's twin so the two pictures of Beloved agree.
const ORGAN_PREVIEW = { heart: 'caution', liver: 'caution', brain: 'watch' }

function Figure({ value, label }) {
  return (
    <div>
      <div className="text-5xl font-extrabold leading-none tracking-tight">{value}</div>
      <div className="mt-2 text-lg font-semibold">{label}</div>
    </div>
  )
}

export function StatsBento() {
  const navigate = useNavigate()
  const { loadPersona, status } = useTwin()
  const [busy, setBusy] = useState(false)
  const building = busy || status === 'building'

  const tryDemo = async () => {
    setBusy(true)
    const ok = await loadPersona('beloved')
    if (ok) navigate('/dashboard')
    else setBusy(false)
  }

  return (
    <Section className="pb-16 sm:pb-20">
      <Heading
        center
        title={
          <>
            Grounded. Explained. <em>Yours.</em>
          </>
        }
        sub="The numbers below are facts about how Twinstate is built — not results from a study we haven't run."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-3 md:grid-rows-[auto_auto]">
        {/* A — tall */}
        <div className="flex flex-col rounded-3xl border border-ink/5 bg-white p-6 shadow-card md:row-span-2">
          <Figure value="5.3M" label="Clinical concepts" />
          <p className="mt-2 text-sm leading-relaxed text-slate-soft">
            Anything you log — "Augmentin", "Panadol Extra", a herbal tonic — resolves to a real
            HOLON concept before it's screened.
          </p>
          <div className="mt-6 flex-1 rounded-2xl border border-ink/5 bg-paper p-3">
            <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm shadow-card">
              <span className="text-slate-soft">⌕</span>
              <span>Augmentin</span>
              <span className="ml-auto h-4 w-px animate-pulse bg-ink/40" />
            </div>
            <ul className="mt-3 space-y-2">
              {[
                ['Amoxicillin / clavulanate', 'antibiotic · prescription'],
                ['Amoxicillin', 'antibiotic · prescription'],
                ['Clavulanic acid', 'β-lactamase inhibitor'],
              ].map(([n, t], i) => (
                <li
                  key={n}
                  className={`rounded-xl px-3 py-2 ${i === 0 ? 'bg-brand-50 ring-1 ring-brand-100' : ''}`}
                >
                  <div className="text-sm font-semibold">{n}</div>
                  <div className="text-[11px] text-slate-soft">{t}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* B */}
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-card">
          <Figure value={Object.keys(ORGANS).length} label="Organ systems modelled" />
          <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2">
            {Object.values(ORGANS).map((o) => (
              <li key={o.key} className="flex items-center gap-2 text-sm text-slate-soft">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: RISK[ORGAN_PREVIEW[o.key] || 'calm'].hex }}
                />
                {o.label.split(' &')[0]}
              </li>
            ))}
          </ul>
        </div>

        {/* C */}
        <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-card">
          <Figure value="< 2 min" label="To build a twin" />
          <ol className="mt-5 space-y-2">
            {['Log what you take', 'Say how you feel', 'See your twin react'].map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm text-slate-soft">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper text-[11px] font-bold text-ink">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        {/* D — wide */}
        <div className="flex flex-col gap-5 rounded-3xl border border-ink/5 bg-white p-6 shadow-card sm:flex-row sm:items-center md:col-span-2">
          <div className="flex-1">
            <Figure value="0" label="API keys needed to run" />
            <p className="mt-2 text-sm leading-relaxed text-slate-soft">
              Works fully offline on a deterministic engine. Add a HOLON key for live clinical
              knowledge; nothing dead-ends without one.
            </p>
            <button
              onClick={tryDemo}
              disabled={building}
              className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
            >
              {building ? 'Loading…' : 'Try a sample twin'}
            </button>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2">
            {PERSONAS.map((p) => (
              <div
                key={p.id}
                className={`flex h-20 w-20 items-end rounded-2xl bg-gradient-to-br p-2 text-xs font-bold text-ink/80 ${p.avatarTone}`}
              >
                {p.name.split(',')[0]}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

// ── 4. Safety ─────────────────────────────────────────────────────────────
const SAFETY = [
  {
    t: 'Not a diagnosis',
    d: "Twinstate explains what's known about combinations. It does not diagnose, and it never makes prescription decisions.",
  },
  {
    t: 'Urgent symptoms route straight to care',
    d: 'Chest pain, trouble breathing, a possible overdose or self-harm bypass the model entirely and show emergency guidance.',
  },
  {
    t: 'Grounded, not improvised',
    d: 'Answers are tied to what you logged and to clinical interaction knowledge — with a deterministic engine underneath, so a model outage never invents an answer.',
  },
  {
    t: 'Your data stays in your browser',
    d: 'No account, no server storing your medication history. Clearing your browser clears it.',
  },
]

export function SafetySection() {
  return (
    <Section id="safety" className="pb-16 sm:pb-20">
      <Heading
        title={
          <>
            Safety, <em>stated plainly.</em>
          </>
        }
        sub="A health tool that overstates itself is worse than none. Here is exactly what Twinstate is and isn't."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SAFETY.map((s) => (
          <div key={s.t} className="rounded-3xl border border-ink/5 bg-white p-6 shadow-card">
            <h3 className="flex items-center gap-2.5 font-bold">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs text-emerald-700">
                ✓
              </span>
              {s.t}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-soft">{s.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-3xl border border-risk-urgent/20 bg-rose-50 p-5">
        <p className="text-sm leading-relaxed text-rose-900">
          <span className="font-bold">In an emergency</span>, don't use this app — contact local
          emergency services or go to the nearest hospital.
        </p>
      </div>
    </Section>
  )
}

// ── 5. FAQ ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Is this a replacement for medical advice?',
    a: "No. Twinstate is an educational tool built by students. It explains what's known about the combinations you log, but it doesn't diagnose and it isn't a substitute for a clinician.",
  },
  {
    q: 'Where does the drug-interaction knowledge come from?',
    a: "With a HOLON key configured, substances resolve against real clinical concepts and the full list is screened through HOLON's interaction knowledge base — severity, mechanism, clinical effect and management. Without a key, the demo runs on a small illustrative rule set that is clearly marked as simulated.",
  },
  {
    q: 'Do I need an account?',
    a: 'No. You type a first name so the dashboard can greet you, and everything is stored in your own browser. There is no password and no server holding your history.',
  },
  {
    q: 'Does it work without an internet connection or API key?',
    a: 'Yes. Every AI path falls back to a deterministic engine, so the twin, the flags and the What-If projection all still work. That is deliberate — a health tool should never dead-end.',
  },
  {
    q: 'Is the demo data real?',
    a: 'No. The sample students and their week of history are fabricated for demonstration and labelled as such in the source. Anything you log yourself is your own.',
  },
]

export function FaqSection() {
  const [open, setOpen] = useState(0)
  return (
    <Section id="faq" className="pb-10 sm:pb-12">
      <Heading center title="Frequently asked questions" />
      <div className="mx-auto mt-8 max-w-3xl space-y-2.5">
        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q} className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-card">
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-display text-xl">{f.q}</span>
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink/10 text-slate-soft"
                  aria-hidden="true"
                >
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-soft">{f.a}</p>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ── 6. CTA band ───────────────────────────────────────────────────────────
export function CtaBand() {
  const navigate = useNavigate()
  const { loadPersona, status } = useTwin()
  const [busy, setBusy] = useState(false)
  const building = busy || status === 'building'

  const tryDemo = async () => {
    setBusy(true)
    const ok = await loadPersona('beloved')
    if (ok) navigate('/dashboard')
    else setBusy(false)
  }

  return (
    <Section className="pb-16 sm:pb-20">
      <div className="hero-card mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-3xl px-6 py-6 text-frost sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-lg">
            ?
          </span>
          <div>
            <p className="font-bold">Still have questions?</p>
            <p className="text-sm text-mist">The twin answers grounded in what you log — try it on a sample student.</p>
          </div>
        </div>
        <button
          onClick={tryDemo}
          disabled={building}
          className="shrink-0 rounded-full bg-brand-grad px-5 py-2.5 text-sm font-semibold text-white shadow-halo transition hover:brightness-110 disabled:opacity-60"
        >
          {building ? 'Loading…' : 'Open a demo →'}
        </button>
      </div>
    </Section>
  )
}

// ── 7. Footer ─────────────────────────────────────────────────────────────
const FOOTER_COLS = [
  {
    h: 'Product',
    links: [
      ['#how', 'How it works'],
      ['#safety', 'Safety'],
      ['#faq', 'FAQ'],
      ['/faq', 'Health FAQ (in app)'],
    ],
  },
  {
    h: 'Platform',
    links: [
      ['#how', 'HOLON clinical knowledge'],
      ['#how', '3D anatomy twin'],
      ['#how', 'AI reasoning'],
      ['#how', 'What-If simulation'],
    ],
  },
  {
    h: 'Project',
    links: [
      ['#top', 'Ontomorph Hackathon 2026'],
      ['#safety', 'Not medical advice'],
      ['#faq', 'Simulated demo data'],
    ],
  },
]

export function SiteFooter() {
  return (
    <div className="px-3 pb-3 sm:px-5 sm:pb-5">
      <footer className="hero-card mx-auto max-w-[1200px] rounded-[2rem] px-6 py-8 text-frost sm:rounded-[2.5rem] sm:px-10 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-9 w-9" />
              <span className="text-lg font-extrabold tracking-tight">
                <span className="text-brand-300">Twin</span>
                <span className="text-risk-calm">state</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist">
              Track what you take and see its real effect on your body — a living twin powered by
              Ontomorph DTP + HOLON.
            </p>

            <h3 className="mt-8 text-base font-bold">Get early access</h3>
            <p className="mt-1 text-sm text-mist">
              Built in a week at the Ontomorph Hackathon. Still being built. Leave your email and
              we'll tell you when it opens up properly.
            </p>
            <EarlyAccessForm compact />
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_COLS.map((c) => (
              <div key={c.h}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-mist/80">{c.h}</h4>
                <ul className="mt-3 space-y-2">
                  {c.links.map(([href, label]) => (
                    <li key={label}>
                      <a href={href} className="text-sm text-frost/85 transition hover:text-frost">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rule-fade my-8" />

        <div className="flex flex-col items-start justify-between gap-3 text-xs text-mist sm:flex-row sm:items-center">
          <span>© 2026 Twinstate · OAU, Ontomorph Hackathon</span>
          <span className="max-w-lg leading-relaxed sm:text-right">
            An educational tool, not a medical device. It does not diagnose or make prescription
            decisions. In an emergency, contact local emergency services.
          </span>
        </div>
      </footer>
    </div>
  )
}
