import { RISK } from '../../../utils/risk.js'

/** Direction of a load number, where higher is worse. Inherits text colour, so it works on light and dark. */
export default function Delta({ prev, cur }) {
  const diff = cur - prev
  const tone = diff > 0 ? RISK.caution.hex : diff < 0 ? RISK.calm.hex : '#96A3BD'
  return (
    <span className="inline-flex items-center gap-1 text-xs opacity-80">
      <span className="font-bold" style={{ color: tone }} aria-hidden="true">
        {diff > 0 ? '↑' : diff < 0 ? '↓' : '→'}
      </span>
      <span className="sr-only">{diff > 0 ? 'up' : diff < 0 ? 'down' : 'unchanged'}</span>
      {diff !== 0 && <span>{Math.abs(diff)}</span>}
    </span>
  )
}
