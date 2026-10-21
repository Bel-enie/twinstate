/**
 * Semicircle gauge (0–max): a pale track with the value drawn over it in the
 * given colour, the number sitting inside the arc and the label below it.
 * Pure SVG, no library.
 */
export default function Gauge({ value = 0, max = 100, color = '#4B84F0', label = '', unit = `/${max}` }) {
  const r = 84
  const stroke = 22
  const cx = 110
  const cy = 108
  const half = Math.PI * r // length of the semicircle
  const pct = Math.max(0, Math.min(1, value / max))
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  return (
    <div className="mx-auto w-full max-w-[260px]">
      <div className="relative">
        <svg viewBox="0 0 220 120" className="w-full" role="img" aria-label={`${label} ${value} of ${max}`}>
          <path d={d} fill="none" stroke="#B9D4FF" strokeOpacity="0.55" strokeWidth={stroke} strokeLinecap="round" />
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${half * pct} ${half}`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <span className="font-display text-5xl font-extrabold leading-none tracking-[-0.03em]">
            {value}
            <span className="ml-0.5 text-sm font-semibold text-slate-soft">{unit}</span>
          </span>
        </div>
      </div>
      {label && <div className="mt-2 text-center text-sm text-slate-soft">{label}</div>}
    </div>
  )
}
