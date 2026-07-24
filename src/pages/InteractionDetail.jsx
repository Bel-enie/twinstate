import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell.jsx'
import AnatomyModel from '../components/anatomy/AnatomyModel.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import RiskBadge from '../components/ui/RiskBadge.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { reasoning } from '../services/index.js'
import { riskOf } from '../utils/risk.js'
import { EmergencyNote } from '../components/safety/SafetyLayer.jsx'

export default function InteractionDetail() {
  const { flagId } = useParams()
  const navigate = useNavigate()
  const { flags } = useTwin()
  const flag = flags.find((f) => f.id === flagId)

  const [explain, setExplain] = useState(null)

  useEffect(() => {
    if (flag) reasoning.explainFlag(flag).then(setExplain)
  }, [flagId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!flag) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-lg p-6 text-center">
          <p className="text-sm text-slate-soft">That interaction isn't in your current twin.</p>
          <Button to="/dashboard" className="mt-4">
            Back to twin
          </Button>
        </Card>
      </AppShell>
    )
  }

  const r = riskOf(flag.severity)
  const organRisk = { [flag.organ]: { severity: flag.severity } }

  return (
    <AppShell>
      <button onClick={() => navigate(-1)} className="mb-3 text-sm font-semibold text-brand-600">
        ← Back to twin
      </button>

      <div className="grid gap-5 md:grid-cols-[300px_minmax(0,1fr)]">
        {/* focused organ */}
        <div className="stage-backdrop flex flex-col items-center justify-center rounded-[12px] p-4">
          <div className="h-64 w-full max-w-[220px]">
            <AnatomyModel organRisk={organRisk} selected={flag.organ} />
          </div>
          <p className="text-sm font-semibold text-white/80">{flag.organLabel}</p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{flag.title}</h1>
              <RiskBadge severity={flag.severity} />
            </div>
            {explain?.tone && <p className="mt-1 text-sm font-medium" style={{ color: r.hex }}>{explain.tone}</p>}
          </div>

          {/* What's interacting */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-soft">What's interacting</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {flag.substances.map((s, i) => (
                <span key={s.id} className="flex items-center gap-2">
                  {i > 0 && <span className="text-slate-soft">＋</span>}
                  <span className="rounded-xl bg-shell px-3 py-1.5 text-sm font-semibold">{s.label.split(' (')[0]}</span>
                </span>
              ))}
            </div>
          </Card>

          {/* Why it's risky */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-soft">Why it's risky — in plain English</h2>
            <p className="mt-2 leading-relaxed text-ink/85">{explain?.plain || flag.reason}</p>
          </Card>

          {/* Safer alternative */}
          <div className="rounded-[12px] border border-emerald-100 bg-emerald-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <span>✓</span> A safer alternative
            </h2>
            <p className="mt-2 leading-relaxed text-emerald-900/85">
              {explain?.safer || flag.saferAlternative}
            </p>
          </div>

          {/* Evidence & sources */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-soft">Evidence &amp; sources</h2>
            <p className="mt-2 text-sm text-ink/80">{flag.reference}</p>
            {flag.sources?.length > 0 && (
              <ul className="mt-3 space-y-2">
                {flag.sources.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 text-sm"
                    >
                      <span className="mt-0.5 shrink-0 rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                        {s.org}
                      </span>
                      <span className="text-brand-700 underline decoration-brand-200 underline-offset-2 group-hover:decoration-brand-500">
                        {s.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-slate-soft">
              Cross-referenced against public clinical guidance. General information only — not a
              substitute for advice about your specific medicines.
            </p>
          </Card>

          {(flag.severity === 'urgent' || flag.severity === 'caution') && (
            <EmergencyNote />
          )}

          <div className="flex gap-2">
            <Button to="/what-if">
              See this play out →
            </Button>
            <Button to="/recommendation" variant="ghost">
              What should I do?
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
