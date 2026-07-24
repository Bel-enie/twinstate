import { RISK } from '../../utils/risk.js'

export default function RiskLegend({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
      {Object.values(RISK).map((r) => (
        <span key={r.key} className="flex items-center gap-1.5 text-xs text-white/70">
          <span className="h-2 w-2 rounded-full" style={{ background: r.hex }} />
          {r.label}
        </span>
      ))}
    </div>
  )
}
