import { Link } from 'react-router-dom'
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
 */
export default function Nav({ latest, onResume, onBuild }) {
  const stuck = useStuck()

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
        </div>
      </div>
    </header>
  )
}
