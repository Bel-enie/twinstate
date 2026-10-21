import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import BrandMark from '../components/ui/BrandMark.jsx'
import Wordmark from '../components/ui/Wordmark.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { reasoning } from '../services/index.js'
import { SUBSTANCE_BY_ID, SYMPTOMS } from '../services/mock/mockData.js'
import { CATEGORY_LABEL, RISK } from '../utils/risk.js'
import { coverageOf, labelOf } from '../services/analysis/coverage.js'
import { ORIGIN_LABEL, confidenceOf, originOfFlag, pharmacistQuestion, sourceOrgs } from '../utils/flagEvidence.js'

/**
 * A one-page summary to show a pharmacist or clinician: what is logged, what
 * was flagged and why, what could not be checked, and the questions to ask.
 * Plain white, no app chrome, and laid out to print on a single sheet.
 */
export default function Summary() {
  const { twin, items, symptoms, flags, overall } = useTwin()
  const coverage = coverageOf(items)
  const [rec, setRec] = useState(null)

  useEffect(() => {
    let live = true
    reasoning
      .recommend({ name: twin?.name, flags, overall, items, symptoms })
      .then((r) => live && setRec(r))
      .catch(() => live && setRec(null))
    return () => {
      live = false
    }
  }, [twin, flags, overall, items, symptoms])

  const name = twin?.name?.split(',')[0]?.trim()
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const symptomLabels = (symptoms || []).map((id) => SYMPTOMS.find((s) => s.id === id)?.label || id)
  const questions = [...new Set(flags.map(pharmacistQuestion))]
  if (coverage.unchecked.length) {
    questions.push(`Could any of these interact with the rest: ${coverage.unchecked.map(labelOf).join(', ')}?`)
  }

  return (
    <div className="min-h-full bg-paper py-6 print:bg-white print:py-0">
      {/* Toolbar: screen only */}
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3 px-4 print:hidden">
        <Link to="/recommendation" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Link>
        <button onClick={() => window.print()} className="btn-solid inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold">
          <Printer className="h-4 w-4" aria-hidden="true" /> Print or save as PDF
        </button>
      </div>

      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-card sm:p-10 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <BrandMark className="h-8 w-8" />
              <Wordmark className="text-lg" />
            </div>
            <h1 className="mt-3 text-2xl font-extrabold">Medicines summary{name && name !== 'You' ? ` · ${name}` : ''}</h1>
            <p className="mt-1 text-sm text-slate-soft">Prepared {date}, from what the person logged in Twinstate.</p>
          </div>
          <div className="text-right text-sm">
            <div className="text-slate-soft">Overall</div>
            <div className="font-bold" style={{ color: RISK[overall]?.hex }}>
              {RISK[overall]?.label || overall}
            </div>
          </div>
        </header>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-soft">Currently taking</h2>
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs text-slate-soft">
                <th className="py-2 font-semibold">Substance</th>
                <th className="py-2 font-semibold">Dose</th>
                <th className="py-2 font-semibold">How often</th>
                <th className="py-2 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const def = SUBSTANCE_BY_ID[it.substanceId] || it.def || {}
                return (
                  <tr key={it.substanceId} className="border-b border-ink/5">
                    <td className="py-2 font-semibold">{(def.label || it.substanceId).split(' (')[0]}</td>
                    <td className="py-2">
                      {it.dose} {def.unit || ''}
                    </td>
                    <td className="py-2">{String(it.frequency || '').replace('x', '') || '—'}</td>
                    <td className="py-2 text-slate-soft">{CATEGORY_LABEL[def.category] || 'Tracked'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {symptomLabels.length > 0 && (
            <p className="mt-3 text-sm">
              <span className="font-semibold">Symptoms logged:</span> {symptomLabels.join(', ')}
            </p>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-soft">Flagged combinations</h2>
          {flags.length === 0 ? (
            <p className="mt-2 text-sm">Nothing flagged by the rules Twinstate checks. This is not a clean bill of health.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {flags.map((f) => (
                <li key={f.id} className="break-inside-avoid rounded-2xl border border-ink/10 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold">{f.title}</span>
                    <span className="text-xs font-semibold" style={{ color: RISK[f.severity]?.hex }}>
                      {RISK[f.severity]?.label} · {f.organLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/80">{f.reason}</p>
                  <p className="mt-2 text-xs text-slate-soft">
                    Involves {f.substances.map((s) => s.label.split(' (')[0]).join(', ')} · {ORIGIN_LABEL[originOfFlag(f)]}
                    {sourceOrgs(f).length ? ` · ${sourceOrgs(f).join(', ')}` : ''} · {confidenceOf(f, items).label}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {(coverage.unchecked.length > 0 || coverage.hasUnverified) && (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-soft">Not fully checked</h2>
            {coverage.unchecked.length > 0 && (
              <p className="mt-2 text-sm">
                <span className="font-semibold">Not identified, no rule ran:</span> {coverage.unchecked.map(labelOf).join(', ')}
              </p>
            )}
            {coverage.hasUnverified && (
              <p className="mt-1 text-sm">
                <span className="font-semibold">Identified by AI, unverified:</span> {coverage.unverified.map(labelOf).join(', ')}
              </p>
            )}
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-soft">Questions to ask</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
            {(questions.length ? questions : ['Is everything I take safe together at these doses?']).map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          {rec?.action && (
            <p className="mt-3 text-sm">
              <span className="font-semibold">Twinstate’s suggested next step:</span> {rec.action}
            </p>
          )}
        </section>

        <footer className="mt-8 border-t border-ink/10 pt-4 text-xs leading-relaxed text-slate-soft">
          Twinstate is an educational tool, not a medical device. It does not diagnose or make prescription decisions,
          and it only checks a limited set of interactions. Please confirm anything here with a pharmacist or doctor.
          In an emergency, contact local emergency services.
        </footer>
      </article>
    </div>
  )
}
