import { useNavigate } from 'react-router-dom'
import RiskBadge from '../ui/RiskBadge.jsx'
import { riskOf } from '../../utils/risk.js'

export default function FlagCard({ flag, active, onHover, onLeave }) {
  const navigate = useNavigate()
  const r = riskOf(flag.severity)

  return (
    <button
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onClick={() => navigate(`/interaction/${flag.id}`)}
      className={`w-full border p-4 text-left transition-colors ${
        active ? 'border-brand-300 bg-brand-50/40' : 'border-[color:var(--panel-line)] bg-white hover:bg-shell/60'
      }`}
      style={{ borderRadius: 'var(--panel-r)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.hex }} />
          <h3 className="font-bold leading-tight">{flag.title}</h3>
        </div>
        <RiskBadge severity={flag.severity} showDot={false} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-slate-soft">{flag.reason}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {flag.substances.map((s) => (
          <span key={s.id} className="rounded-[6px] border border-[color:var(--panel-line)] bg-shell/70 px-2 py-0.5 text-[11px] font-medium">
            {s.label.split(' (')[0]}
          </span>
        ))}
        <span className="ml-auto text-xs font-semibold text-brand-600">Details →</span>
      </div>
    </button>
  )
}
