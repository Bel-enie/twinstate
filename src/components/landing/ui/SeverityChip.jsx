import { RISK } from '../../../utils/risk.js'

/** Severity pill: coloured dot plus the word, so severity never relies on colour alone. */
export default function SeverityChip({ severity }) {
  const r = RISK[severity] || RISK.calm
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${r.chipBg} ${r.chipText}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.hex }} aria-hidden="true" />
      {severity}
    </span>
  )
}
