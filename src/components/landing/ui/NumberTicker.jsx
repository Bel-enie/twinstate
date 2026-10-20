import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/**
 * Magic UI-style count-up. Animates from 0 (or `from`) to `value` once the
 * number scrolls into view; renders the final value immediately under
 * prefers-reduced-motion. Negative values and a +/- sign prefix are supported
 * so deltas ("-14 this week") tick too.
 */
export default function NumberTicker({ value, from = 0, duration = 1.2, signed = false, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : from)

  useEffect(() => {
    if (!inView) return undefined
    if (reduce) {
      setShown(value)
      return undefined
    }
    let raf
    const t0 = performance.now()
    const ms = duration * 1000
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(from + (value - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduce, value, from, duration])

  const text = signed && shown > 0 ? `+${shown}` : String(shown)
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  )
}
