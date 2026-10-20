import { Children, createRef, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

/**
 * Scroll-stack (the 21st.dev / Aceternity "sticky cards" pattern): each card
 * pins below the floating nav and the next one slides up over it, while the
 * covered card eases back (scale + a soft veil).
 *
 *  - A card taller than the viewport pins only once its BOTTOM is visible
 *    (top = min(offset, viewport - height)), so no content is ever hidden
 *    under the next card.
 *  - Below md the cards simply stack: pinning tall cards on a phone fights
 *    the scroll.
 *  - Under prefers-reduced-motion the cards still pin, but nothing scales.
 */
const BASE_TOP = 96 // clears the floating nav pill
const STEP = 18 // each later card pins a little lower, so the edges show
const MARGIN = 20

function useDesktop() {
  const query = '(min-width: 768px)'
  const [ok, setOk] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setOk(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return ok
}

function useStickyTop(ref, index) {
  const want = BASE_TOP + index * STEP
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

function StackItem({ index, selfRef, nextRef, desktop, children }) {
  const reduce = useReducedMotion()
  const top = useStickyTop(selfRef, index)
  const animate = desktop && !reduce && Boolean(nextRef)

  // Progress = how far the NEXT card has travelled from the bottom of the
  // viewport to its own pinned line.
  const { scrollYProgress } = useScroll({
    target: nextRef || selfRef,
    offset: ['start end', `start ${BASE_TOP + (index + 1) * STEP}px`],
  })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94])
  const veil = useTransform(scrollYProgress, [0, 1], [0, 0.45])

  return (
    <div ref={selfRef} className="md:sticky" style={desktop ? { top } : undefined}>
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
  const desktop = useDesktop()

  return (
    <div className={`space-y-6 md:space-y-10 ${className}`}>
      {items.map((child, i) => (
        <StackItem key={i} index={i} selfRef={refs[i]} nextRef={refs[i + 1]} desktop={desktop}>
          {child}
        </StackItem>
      ))}
    </div>
  )
}
