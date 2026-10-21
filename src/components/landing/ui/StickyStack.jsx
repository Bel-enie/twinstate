import { Children, createRef, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

/**
 * Scroll-stack (the 21st.dev / Aceternity "sticky cards" pattern): each card
 * pins below the floating nav and the next one slides up over it, while the
 * covered card eases back (scale + a soft veil). Works on phones too, with a
 * shorter offset under the smaller nav.
 *
 *  - A card taller than the viewport pins only once its BOTTOM is visible
 *    (top = min(offset, viewport - height)), so no content is ever hidden
 *    under the next card — which matters most on phones, where every card is
 *    taller than the screen.
 *  - Under prefers-reduced-motion the cards still pin, but nothing scales.
 */
const MARGIN = 16

function useMetrics() {
  const query = '(min-width: 768px)'
  const read = () => (typeof window !== 'undefined' && window.matchMedia(query).matches)
  const [desktop, setDesktop] = useState(read)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setDesktop(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  // Desktop clears the floating nav pill; phones clear the shorter one.
  return desktop ? { base: 96, step: 18, shrink: 0.94 } : { base: 76, step: 10, shrink: 0.96 }
}

function useStickyTop(ref, want) {
  const [top, setTop] = useState(want)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const update = () => setTop(Math.min(want, window.innerHeight - el.offsetHeight - MARGIN))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [ref, want])
  return top
}

function StackItem({ index, selfRef, nextRef, metrics, children }) {
  const reduce = useReducedMotion()
  const want = metrics.base + index * metrics.step
  const top = useStickyTop(selfRef, want)
  const animate = !reduce && Boolean(nextRef)

  // Progress = how far the NEXT card has travelled from the bottom of the
  // viewport to its own pinned line.
  const { scrollYProgress } = useScroll({
    target: nextRef || selfRef,
    offset: ['start end', `start ${metrics.base + (index + 1) * metrics.step}px`],
  })
  const scale = useTransform(scrollYProgress, [0, 1], [1, metrics.shrink])
  const veil = useTransform(scrollYProgress, [0, 1], [0, 0.45])

  return (
    <div ref={selfRef} className="sticky" style={{ top }}>
      <motion.div className="relative" style={animate ? { scale, transformOrigin: '50% 0%' } : undefined}>
        {children}
        {animate && (
          <motion.div
            aria-hidden="true"
            style={{ opacity: veil }}
            className="pointer-events-none absolute inset-0 rounded-[30px] bg-paper"
          />
        )}
      </motion.div>
    </div>
  )
}

export default function StickyStack({ children, className = '' }) {
  const items = Children.toArray(children)
  const refs = useMemo(() => items.map(() => createRef()), [items.length])
  const metrics = useMetrics()

  return (
    <div className={`space-y-6 md:space-y-10 ${className}`}>
      {items.map((child, i) => (
        <StackItem key={i} index={i} selfRef={refs[i]} nextRef={refs[i + 1]} metrics={metrics}>
          {child}
        </StackItem>
      ))}
    </div>
  )
}
