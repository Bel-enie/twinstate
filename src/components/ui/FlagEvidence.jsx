import { BookOpen, Database, ShieldCheck, Sparkles } from 'lucide-react'
import { ORIGIN_HELP, ORIGIN_LABEL, confidenceOf, originOfFlag, sourceOrgs } from '../../utils/flagEvidence.js'

const ORIGIN_ICON = { rule: ShieldCheck, ai: Sparkles, holon: Database }
const CONF_TONE = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  low: 'border-rose-200 bg-rose-50 text-rose-800',
}

/**
 * The evidence chips under a flag: where it came from, the guidance it cites,
 * and a confidence label, so uncertainty is always visible next to the claim.
 */
export default function FlagEvidence({ flag, items = [], className = '' }) {
  const origin = originOfFlag(flag)
  const OriginIcon = ORIGIN_ICON[origin]
  const orgs = sourceOrgs(flag)
  const conf = confidenceOf(flag, items)

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        title={ORIGIN_HELP[origin]}
        className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-800"
      >
        <OriginIcon className="h-3 w-3" aria-hidden="true" />
        {ORIGIN_LABEL[origin]}
      </span>
      {orgs.length > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-2 py-0.5 text-[10px] font-semibold text-ink/80">
          <BookOpen className="h-3 w-3" aria-hidden="true" />
          {orgs.join(' · ')}
        </span>
      )}
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CONF_TONE[conf.level]}`}>
        <span className="sr-only">Confidence: </span>
        {conf.label}
      </span>
    </div>
  )
}
