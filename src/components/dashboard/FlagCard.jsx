import { useNavigate } from 'react-router-dom'
import RiskBadge from '../ui/RiskBadge.jsx'
import { riskOf } from '../../utils/risk.js'

/**
 * One flag in the register. Hovering or focusing it lights the organ on the
 * twin (via onHover/onLeave); only a click opens the detail page.
 */
export default function FlagCard({ flag, active, onHover, onLeave }) {
  const navigate = useNavigate()
  const r = riskOf(flag.severity)

  return (
    <button
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onClick={() => navigate(`/interaction/${flag.id}`)}
      className={`w-full border p-4 text-left transition-colors ${
        active
          ? 'border-violet-300 bg-violet-50/60'
          : 'border-[color:var(--panel-line)] bg-white hover:bg-violet-50/40'
      }`}
      style={{ borderRadius: 'var(--panel-r)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.hex }} aria-hidden="true" />
          <h3 className="font-bold leading-tight">{flag.title}</h3>
        </div>
        <RiskBadge severity={flag.severity} showDot={false} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-slate-soft">{flag.reason}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {flag.substances.map((s) => (
          <span
            key={s.id}
            className="rounded-md border border-[color:var(--panel-line)] bg-paper px-2 py-0.5 text-[11px] font-medium"
          >
            {s.label.split(' (')[0]}
          </span>
        ))}
        <span className="ml-auto text-xs font-semibold text-violet-600">Details →</span>
      </div>
    </button>
  )
}
