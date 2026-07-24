import Card from '../ui/Card.jsx'
import DeltaBadge from './DeltaBadge.jsx'

/**
 * One tile in the stat row: a label with a state dot in the corner, a hero
 * number, then a single caption line. Tiles are equal-height (h-full) so a
 * row of them lands on one baseline whatever each caption's length.
 *
 * `tone` drives only the corner dot — the number itself stays ink, so a row
 * of tiles reads as one scale rather than as four coloured scores.
 */
const DOT = {
  neutral: 'bg-ink/20',
  calm: 'bg-risk-calm',
  watch: 'bg-risk-watch',
  caution: 'bg-risk-caution',
  urgent: 'bg-risk-urgent',
}

export default function StatCard({
  label,
  value,
  unit = '',
  delta,
  deltaSuffix = '',
  goodWhenDown = true,
  tone = 'neutral',
  children,
  footer,
  className = '',
}) {
  return (
    <Card className={`flex h-full flex-col p-5 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold text-slate-soft">{label}</span>
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[tone] || DOT.neutral}`} aria-hidden="true" />
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-[32px] font-extrabold leading-none tracking-tight">
          {value}
          {unit && <span className="ml-0.5 text-base font-bold text-slate-soft">{unit}</span>}
        </span>
        {delta != null && (
          <DeltaBadge delta={delta} suffix={deltaSuffix} goodWhenDown={goodWhenDown} className="mb-0.5" />
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
      {footer && <p className="mt-2 text-xs leading-relaxed text-slate-soft">{footer}</p>}
    </Card>
  )
}
