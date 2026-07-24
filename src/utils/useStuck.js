import { useEffect, useState } from 'react'

/**
 * True once the page has scrolled past `offset`.
 *
 * A sticky header should look flush with the page at rest and lifted once
 * content is passing underneath it — otherwise it either floats with no
 * anchor, or carries a shadow over nothing. Passive listener, and it reads
 * the initial position so a restored scroll position is correct on mount.
 */
export function useStuck(offset = 4) {
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const read = () => setStuck(window.scrollY > offset)
    read()
    window.addEventListener('scroll', read, { passive: true })
    return () => window.removeEventListener('scroll', read)
  }, [offset])

  return stuck
}
