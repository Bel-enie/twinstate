import Card from '../ui/Card.jsx'
import DeltaBadge from './DeltaBadge.jsx'

/**
 * Reusable stat tile: label + corner arrow, a hero number with optional unit and
 * delta badge, and a slot for a meter / chart. Mirrors the reference's floating
 * stat cards.
 */
export default function StatCard({
  label,
  value,
  unit = '',
  delta,
  deltaSuffix = '',
  goodWhenDown = true,
  children,
  footer,
  className = '',
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-bold text-slate-soft">{label}</span>
        <span className="text-slate-soft/40" aria-hidden="true">↗</span>
      </div>
      <div className="mt-1.5 flex items-end gap-2">
        <span className="text-3xl font-extrabold leading-none tracking-tight">
          {value}
          {unit && <span className="ml-0.5 text-lg font-bold text-slate-soft">{unit}</span>}
        </span>
        {delta != null && (
          <DeltaBadge delta={delta} suffix={deltaSuffix} goodWhenDown={goodWhenDown} className="mb-0.5" />
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
      {footer && <p className="mt-2 text-xs text-slate-soft">{footer}</p>}
    </Card>
  )
}
