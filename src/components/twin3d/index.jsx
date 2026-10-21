import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import AnatomyModel from '../anatomy/AnatomyModel.jsx'
import { ORGANS } from '../../services/mock/mockData.js'
import { RISK } from '../../utils/risk.js'

/**
 * Lazy, guarded entry to the WebGL twin.
 *
 *  - three.js is split into its own chunk and only fetched when this mounts,
 *    so the rest of the app never pays for it.
 *  - The flat CSS twin renders instead when WebGL is unavailable, when the
 *    browser asks to save data, on a 2G connection, or on a low-memory phone
 *    — same props, same organ colours, organ taps still work.
 *  - The render loop pauses while the twin is scrolled out of view.
 *  - Screen readers get a text summary of every organ's state, since the
 *    canvas itself cannot be read.
 */
const HealthTwin = lazy(() => import('./HealthTwin.jsx'))

let webglSupport = null
function supportsWebGL() {
  if (webglSupport !== null) return webglSupport
  if (/[?&]nogl=1/.test(window.location.search)) {
    webglSupport = false
    return false
  }
  // Light mode for weak devices and slow or metered connections: skip the
  // ~840 kB 3D download entirely and use the flat twin.
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const slow = conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2
  if (slow || lowMemory) {
    webglSupport = false
    return false
  }
  try {
    const c = document.createElement('canvas')
    webglSupport = Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webglSupport = false
  }
  return webglSupport
}

/** "Heart: time to change something. Liver: keep an eye on it. Others: all clear." */
function describe(organRisk = {}) {
  const flagged = Object.keys(ORGANS).filter((k) => (organRisk[k]?.severity || 'calm') !== 'calm')
  if (!flagged.length) return 'All organs clear.'
  const parts = flagged.map((k) => `${ORGANS[k].label}: ${RISK[organRisk[k].severity]?.label || organRisk[k].severity}`)
  const calm = Object.keys(ORGANS).length - flagged.length
  return `${parts.join('. ')}.${calm ? ` ${calm === 1 ? 'One other organ is' : `${calm} other organs are`} clear.` : ''}`
}

export default function Twin3D({ organRisk, selected, onSelect, showLabels = true, className = '' }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(true)
  const [ok] = useState(() => supportsWebGL())

  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '120px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  // The CSS twin takes the same selection props, so organ clicks keep working
  // without WebGL (this used to drop them and dead-end "click an organ").
  const fallback = <AnatomyModel organRisk={organRisk} selected={selected} onSelect={onSelect} compact />

  return (
    <div ref={ref} className={`h-full w-full ${className}`} role="group" aria-label="3D body twin">
      <p className="sr-only" aria-live="polite">
        {describe(organRisk)}
      </p>
      {ok ? (
        <Suspense fallback={fallback}>
          <HealthTwin
            organRisk={organRisk}
            selected={selected}
            onSelect={onSelect}
            showLabels={showLabels}
            active={inView}
          />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}
