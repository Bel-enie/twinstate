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
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        active ? 'border-brand-300 bg-white shadow-soft' : 'border-ink/5 bg-white/70 hover:bg-white'
      }`}
      style={active ? { boxShadow: `0 0 0 3px ${r.glow}` } : undefined}
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
          <span key={s.id} className="rounded-full bg-shell px-2 py-0.5 text-[11px] font-medium">
            {s.label.split(' (')[0]}
          </span>
        ))}
        <span className="ml-auto text-xs font-semibold text-brand-600">Details →</span>
      </div>
    </button>
  )
}
