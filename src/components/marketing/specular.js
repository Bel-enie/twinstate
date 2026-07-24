/**
 * Pointer-following reflection for `.btn-specular` buttons.
 *
 * One delegated, passive listener on the document writes `--px` / `--py`
 * (percentages) onto whichever specular button the pointer is over; the CSS
 * `::after` layer reads them. Buttons look finished without any pointer (the
 * highlight defaults to a resting position), and under reduced motion the
 * reflection simply stays put.
 */
export function initSpecularButtons() {
  if (typeof document === 'undefined') return () => {}
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {}

  const onMove = (e) => {
    const el = e.target?.closest?.('.btn-specular')
    if (!el) return
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return
    el.style.setProperty('--px', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
    el.style.setProperty('--py', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
  }
  const onOut = (e) => {
    const el = e.target?.closest?.('.btn-specular')
    if (!el || el.contains(e.relatedTarget)) return
    el.style.removeProperty('--px')
    el.style.removeProperty('--py')
  }

  document.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerout', onOut, { passive: true })
  return () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerout', onOut)
  }
}
