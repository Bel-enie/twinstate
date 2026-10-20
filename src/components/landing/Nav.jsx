import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import BrandMark from '../ui/BrandMark.jsx'
import ShimmerButton from './ui/ShimmerButton.jsx'
import { useStuck } from '../../utils/useStuck.js'

const LINKS = [
  ['#story', 'Why a twin'],
  ['#twin', 'Live twin'],
  ['#access', 'Early access'],
]

/**
 * The floating pill header, restyled for the gradient look. Same .site-pill
 * material as the in-app header so product and site still read as one thing.
 * Below md the section links fold into a menu button instead of vanishing.
 */
export default function Nav({ latest, onResume, onBuild }) {
  const stuck = useStuck()
  const [open, setOpen] = useState(false)

  // Close the menu on Escape and whenever the viewport grows past the breakpoint.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => mq.matches && setOpen(false)
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onChange)
    }
  }, [open])

  return (
    <header data-stuck={stuck} className="site-header sticky top-0 z-40 px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="site-pill mx-auto flex w-full max-w-[1200px] items-center py-2 pl-3 pr-2 sm:pl-5 sm:pr-3">
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          <span className="text-base font-extrabold tracking-tight">
            <span className="bg-[linear-gradient(90deg,#3A66D8,#8B5CF6)] bg-clip-text text-transparent">Twin</span>
            <span className="text-ink">state</span>
          </span>
        </a>

        {/* The twin below really is computed live from the engine, so the
            badge states a fact about the page rather than decorating it. */}
        <span className="ml-3 hidden items-center gap-1.5 rounded-full border border-brand-200/80 bg-white/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-risk-calm motion-safe:animate-pulseGlow" aria-hidden="true" />
          Live
        </span>

        <nav className="mx-auto hidden items-center gap-6 md:flex" aria-label="Landing sections">
          {LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-2.5 py-1 text-sm font-semibold text-ink/70 transition hover:bg-white/60 hover:text-ink"
            >
              {label}
            </a>
          ))}
          <Link
            to="/faq"
            className="rounded-full px-2.5 py-1 text-sm font-semibold text-ink/70 transition hover:bg-white/60 hover:text-ink"
          >
            FAQ
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          {latest && (
            <button
              onClick={() => onResume(latest.key)}
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-soft transition hover:text-ink sm:block"
            >
              Resume {latest.name?.split(',')[0] || 'twin'}
            </button>
          )}
          <ShimmerButton onClick={onBuild} className="px-4 py-2">
            Build my twin
          </ShimmerButton>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid h-9 w-9 place-items-center rounded-full text-ink/80 transition hover:bg-white/60 md:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="landing-menu"
          aria-label="Landing sections"
          className="mx-auto mt-2 w-full max-w-[1200px] rounded-3xl border border-ink/10 bg-white/95 p-2 shadow-soft backdrop-blur md:hidden"
        >
          {LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-ink/80 transition hover:bg-violet-50 hover:text-ink"
            >
              {label}
            </a>
          ))}
          <Link
            to="/faq"
            onClick={() => setOpen(false)}
            className="block rounded-2xl px-4 py-3 text-sm font-semibold text-ink/80 transition hover:bg-violet-50 hover:text-ink"
          >
            FAQ
          </Link>
          {latest && (
            <button
              onClick={() => {
                setOpen(false)
                onResume(latest.key)
              }}
              className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              Resume {latest.name?.split(',')[0] || 'twin'}
            </button>
          )}
        </nav>
      )}
    </header>
  )
}
