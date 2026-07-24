/** Horizontal 0–max meter with a rounded, baseline-anchored fill. */
export default function Meter({ value = 0, max = 100, color = '#4B84F0', height = 10 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="w-full overflow-hidden rounded-full bg-ink/[0.06]" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
