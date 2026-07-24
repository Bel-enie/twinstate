import { useState } from 'react'
import { RISK } from '../../utils/risk.js'

/**
 * Small chart primitives for the landing page — inline SVG, no library.
 *
 * Rules these follow (so every figure on the page reads as one system):
 *  - Text never wears the data colour. Values and labels use the ink tokens;
 *    severity is carried by a coloured mark *beside* the text (dot / chip) and
 *    always with its word, never colour alone.
 *  - A meter's fill carries severity; its track is a light step of the same hue.
 *  - Lines are 2px, end-markers ≥ 8px with a 2px surface ring, area fills ~10%.
 */

/** Body-stress index (0–100) → severity band. Same thresholds as the engine. */
export function bandOf(v) {
  if (v >= 78) return 'urgent'
  if (v >= 58) return 'caution'
  if (v >= 34) return 'watch'
  return 'calm'
}

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

/** Severity pill — coloured dot + the word, on a light or dark surface. */
export function SeverityChip({ severity, label, dark = false, className = '' }) {
  const r = RISK[severity] || RISK.calm
  const surface = dark
    ? 'border border-white/10 bg-white/[0.06] text-frost'
    : `${r.chipBg} ${r.chipText}`
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${surface} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.hex }} />
      {label || severity}
    </span>
  )
}

/** A single ratio against a limit. */
export function Meter({ value, max, severity, dark = false, className = '' }) {
  const r = RISK[severity] || RISK.calm
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full ${className}`}
      style={{ background: rgba(r.hex, dark ? 0.22 : 0.16) }}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.hex }} />
    </div>
  )
}

/**
 * Sparkline — one hue, the current period marked, hover tooltip per point.
 * @param {number[]} points  oldest → newest
 * @param {string[]} labels  same length, e.g. weekday names
 */
export function Sparkline({ points, labels = [], unit = '', dark = false }) {
  const W = 160
  const H = 44
  const P = 6
  const [hover, setHover] = useState(null)

  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const xs = points.map((_, i) => P + (i * (W - 2 * P)) / (points.length - 1))
  const ys = points.map((v) => H - P - ((v - min) / span) * (H - 2 * P))
  const line = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`

  const stroke = '#4B84F0'
  const surface = dark ? '#141C31' : '#FFFFFF'
  const last = points.length - 1
  const slot = W / points.length

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-11 w-full"
        onMouseLeave={() => setHover(null)}
        aria-label={`${points[last].toLocaleString()}${unit} today, from ${points[0].toLocaleString()}${unit} a week ago`}
        role="img"
      >
        <path d={area} fill={stroke} opacity="0.1" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover != null && hover !== last && (
          <circle cx={xs[hover]} cy={ys[hover]} r="4" fill={stroke} stroke={surface} strokeWidth="2" />
        )}
        <circle cx={xs[last]} cy={ys[last]} r="4" fill={stroke} stroke={surface} strokeWidth="2" />
        {/* Hit targets wider than the marks. */}
        {points.map((_, i) => (
          <rect
            key={i}
            x={xs[i] - slot / 2}
            y="0"
            width={slot}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>
      {hover != null && (
        <div
          className="pointer-events-none absolute -top-7 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 text-[11px] font-semibold text-white shadow-card"
          style={{ left: `${(xs[hover] / W) * 100}%` }}
        >
          {labels[hover] ? `${labels[hover]} · ` : ''}
          {points[hover].toLocaleString()}
          {unit}
        </div>
      )}
    </div>
  )
}
