import { riskOf } from '../../utils/risk.js'

export default function RiskBadge({ severity, className = '', showDot = true }) {
  const r = riskOf(severity)
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${r.chipBg} ${r.chipText} ${className}`}
    >
      {showDot && (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.hex }} />
      )}
      {r.label}
    </span>
  )
}
