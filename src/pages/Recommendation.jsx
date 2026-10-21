import { useEffect, useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, Eye, Stethoscope } from 'lucide-react'
import PageHeader, { Chip } from '../components/ui/PageHeader.jsx'
import AppShell from '../components/layout/AppShell.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { reasoning } from '../services/index.js'
import { twinNaming } from '../utils/naming.js'
import { coverageOf, clearanceCopy, labelOf } from '../services/analysis/coverage.js'

const LEVELS = {
  // Not "You're good" — the engine only knows a small curated rule set, so the
  // honest claim is about what was checked, never about the person being fine.
  all_clear: { color: '#3FB8A0', bg: 'rgba(63,184,160,0.10)', icon: CheckCircle2, tag: 'Nothing flagged' },
  // Monitor means something IS flagged but mild — amber, so it never reads as all-clear.
  monitor: { color: '#D99A2B', bg: 'rgba(244,184,96,0.12)', icon: Eye, tag: 'Monitor at home' },
  clinic_soon: { color: '#EF8354', bg: 'rgba(239,131,84,0.10)', icon: Stethoscope, tag: 'Campus clinic soon' },
  seek_care: { color: '#E0567A', bg: 'rgba(224,86,122,0.10)', icon: AlertTriangle, tag: 'Seek care urgently' },
}

// Visual triage ladder.
const LADDER = [
  { key: 'monitor', label: 'Monitor at home' },
  { key: 'clinic_soon', label: 'Campus clinic soon' },
  { key: 'seek_care', label: 'Seek care urgently' },
]

export default function Recommendation() {
  const { twin, flags, overall, items, symptoms } = useTwin()
  const coverage = coverageOf(items)
  const clearance = clearanceCopy(coverage)
  const [rec, setRec] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    setLoading(true)
    setFailed(false)
    reasoning
      .recommend({ name: twin?.name, flags, overall, items, symptoms })
      .then((r) => live && setRec(r))
      .catch(() => live && setFailed(true))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [twin, flags, overall, items, symptoms])

  const level = rec?.level
  const meta = LEVELS[level] || LEVELS.monitor
  const Icon = meta.icon
  const activeIdx = LADDER.findIndex((l) => l.key === level)
  const who = twinNaming(twin?.name)
  const title = who.isSelf ? 'What should I do now?' : `What should ${who.first} do now?`
  const ready = !loading && !failed && rec

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title={title}
          sub={`One clear next step, based on everything in ${who.possessive} twin.`}
          actions={<Chip icon={Stethoscope}>{flags.length} flag{flags.length === 1 ? '' : 's'}</Chip>}
        />

        {/* Headline action. While it loads nothing is coloured or labelled,
            so a triage level never shows before it has been decided. */}
        {ready ? (
          <div className="rounded-3xl border p-6 shadow-soft" style={{ background: meta.bg, borderColor: meta.color }}>
            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: meta.color }}>
              <Icon className="h-5 w-5" aria-hidden="true" />
              {level === 'all_clear' ? clearance.tag : meta.tag}
            </div>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.02em]">{rec.action}</h2>
            <p className="mt-2 text-ink/80">{rec.subtext}</p>
            {level === 'all_clear' && (
              <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-ink/70" style={{ borderColor: meta.color }}>
                {clearance.note}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-ink/10 bg-white p-6" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-soft">
              {loading && <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" aria-hidden="true" />}
              {loading ? 'Working out the next step…' : 'We could not work out the next step just now.'}
            </div>
            {!loading && (
              <p className="mt-2 text-sm text-slate-soft">
                The flags on your twin are still current. If anything feels urgent, contact your campus
                health centre.
              </p>
            )}
          </div>
        )}

        {/* What we could not check. Shown before any reassurance so an
            unrecognised substance is never hidden behind a teal tick. */}
        {coverage.unchecked.length > 0 && (
          <Card className="mt-5 border border-risk-watch/40 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <AlertTriangle className="h-4 w-4 text-risk-caution" aria-hidden="true" /> Not checked ({coverage.unchecked.length})
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-soft">
              We could not identify these, so no interaction rule ran against them. Their absence
              from the flags above means nothing either way — ask a pharmacist about them.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {coverage.unchecked.map((it, i) => (
                <li key={i} className="rounded-full bg-paper px-3 py-1 text-xs font-medium">
                  {labelOf(it)}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {coverage.hasUnverified && (
          <Card className="mt-5 p-5">
            <h3 className="text-sm font-bold text-ink">AI-identified, unverified</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-soft">
              These were matched by the AI rather than a curated entry, so the properties used to
              screen them may be wrong or incomplete.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {coverage.unverified.map((it, i) => (
                <li key={i} className="rounded-full bg-paper px-3 py-1 text-xs font-medium">
                  {labelOf(it)}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Triage ladder. The current step is named in text, not only by colour. */}
        <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Triage ladder">
          {LADDER.map((l, i) => {
            const on = ready && i <= activeIdx && activeIdx >= 0
            const isCurrent = ready && i === activeIdx
            const c = LEVELS[l.key]
            const StepIcon = c.icon
            return (
              <li
                key={l.key}
                aria-current={isCurrent ? 'step' : undefined}
                className={`rounded-2xl border p-3 text-center transition ${isCurrent ? 'shadow-soft' : ''}`}
                style={{
                  borderColor: on ? c.color : 'rgba(31,36,48,0.08)',
                  background: isCurrent ? c.bg : 'white',
                }}
              >
                <StepIcon className="mx-auto h-5 w-5" style={{ color: on ? c.color : '#9AA3B2' }} aria-hidden="true" />
                <div className="mt-1 text-xs font-semibold" style={{ color: on ? c.color : '#5B6472' }}>
                  {l.label}
                </div>
                {isCurrent && (
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: c.color }}>
                    Current
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        {/* Safer swaps */}
        {rec?.swaps?.length > 0 && (
          <Card className="mt-5 p-5">
            <h3 className="text-sm font-bold text-slate-soft">Make these swaps</h3>
            <ul className="mt-3 space-y-2.5">
              {rec.swaps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span className="text-ink/85">{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Emergency note for high risk */}
        {level === 'seek_care' && (
          <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
            If you feel very unwell — chest pain, trouble breathing, confusion, or you can't keep
            fluids down — treat it as an emergency and get help immediately.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button to="/dashboard">
            Back to {who.possessive} twin
          </Button>
          <Button to="/what-if" variant="ghost">
            Compare the two paths
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-soft">
          Educational guidance, not a diagnosis. When in doubt, talk to a pharmacist or your health centre.
        </p>
      </div>
    </AppShell>
  )
}
