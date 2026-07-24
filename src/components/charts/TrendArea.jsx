import { useId, useState } from 'react'

/**
 * Single-series area trend (a sparkline with substance).
 * Follows the dataviz mark specs: 2px rounded line, soft area fill fading to the
 * baseline, a ≥8px last-point marker with a direct value label, recessive
 * baseline, and a per-point hover band with a tooltip. One series → no legend
 * (the card title names it).
 *
 * data: [{ label, value }], max default 100.
 */
export default function TrendArea({ data = [], color = '#4B84F0', max = 100, height = 110, suffix = '' }) {
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState(null)
  if (!data.length) return null

  const W = 320
  const H = height
  const padX = 12
  const padTop = 16
  const padBottom = 16
  const plotW = W - padX * 2
  const plotH = H - padTop - padBottom
  const n = data.length

  const x = (i) => (n === 1 ? padX + plotW / 2 : padX + (i / (n - 1)) * plotW)
  const y = (v) => padTop + plotH - (Math.max(0, Math.min(max, v)) / max) * plotH

  const pts = data.map((d, i) => [x(i), y(d.value)])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L ${x(n - 1).toFixed(1)} ${padTop + plotH} L ${x(0).toFixed(1)} ${padTop + plotH} Z`

  const active = hover != null ? hover : n - 1
  const bandW = plotW / Math.max(1, n - 1)

  return (
    <div className="relative">
      {/* tooltip */}
      <div
        className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft"
        style={{ left: `${Math.max(12, Math.min(88, (x(active) / W) * 100))}%` }}
      >
        {data[active].label}: {data[active].value}
        {suffix}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img" aria-label="Body-stress trend">
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* recessive baseline */}
        <line x1={padX} y1={padTop + plotH} x2={W - padX} y2={padTop + plotH} stroke="#1F2430" strokeOpacity="0.08" />

        <path d={area} fill={`url(#fill-${uid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* active marker */}
        <circle cx={x(active)} cy={y(data[active].value)} r="4.5" fill={color} stroke="#fff" strokeWidth="2" />

        {/* hover bands */}
        {data.map((d, i) => (
          <rect
            key={i}
            x={x(i) - bandW / 2}
            y="0"
            width={bandW}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {/* x labels: first & last only (recessive) */}
      <div className="flex justify-between px-1 text-[10px] text-slate-soft">
        <span>{data[0].label}</span>
        <span>{data[n - 1].label}</span>
      </div>
    </div>
  )
}
