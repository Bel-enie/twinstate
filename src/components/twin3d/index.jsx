import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import AnatomyModel from '../anatomy/AnatomyModel.jsx'

/**
 * Lazy, guarded entry to the WebGL twin.
 *
 *  - three.js is split into its own chunk and only fetched when this mounts,
 *    so the rest of the app never pays for it.
 *  - If WebGL is unavailable (or the chunk hasn't arrived yet) the CSS twin
 *    renders in its place — same props, same organ colours — so nothing
 *    dead-ends.
 *  - The render loop pauses while the twin is scrolled out of view.
 */
const HealthTwin = lazy(() => import('./HealthTwin.jsx'))

let webglSupport = null
function supportsWebGL() {
  if (webglSupport !== null) return webglSupport
  if (/[?&]nogl=1/.test(window.location.search)) {
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

  const fallback = <AnatomyModel organRisk={organRisk} compact />

  return (
    <div ref={ref} className={`h-full w-full ${className}`}>
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
