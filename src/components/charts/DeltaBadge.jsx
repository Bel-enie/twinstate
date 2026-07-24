/**
 * Change badge — arrow + value, never colour-alone (icon carries direction too).
 * For stress metrics, down is good; pass goodWhenDown={false} to flip.
 */
export default function DeltaBadge({ delta, suffix = '', goodWhenDown = true, className = '' }) {
  if (delta == null || Number.isNaN(delta)) return null
  const up = delta > 0
  const flat = delta === 0
  const good = flat ? null : goodWhenDown ? !up : up
  const tone = flat
    ? 'bg-shell text-slate-soft'
    : good
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-orange-50 text-orange-700'
  const arrow = flat ? '→' : up ? '▲' : '▼'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone} ${className}`}>
      {arrow} {Math.abs(delta)}
      {suffix}
    </span>
  )
}
