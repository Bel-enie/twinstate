import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTwin } from '../../context/TwinContext.jsx'
import { dataSourceLabel } from '../../services/index.js'

const TABS = [
  { to: '/dashboard', label: 'Twin' },
  { to: '/history', label: 'History' },
  { to: '/what-if', label: 'What-If' },
  { to: '/recommendation', label: 'Next step' },
]

/** Twinstate logo mark — a droplet in a rounded brand tile. Sized via className. */
function BrandMark({ className = '' }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-soft ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2" aria-hidden="true">
        <path d="M12 3c4 3 7 5 7 9a7 7 0 1 1-14 0c0-4 3-6 7-9Z" fill="currentColor" opacity=".9" />
      </svg>
    </span>
  )
}

export default function Header() {
  const { hasTwin, session, signOut } = useTwin()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const firstName = session?.name?.split(',')[0]

  const onSwitch = () => {
    signOut()
    navigate('/welcome')
  }

  return (
    <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur-md sm:rounded-t-[2.25rem]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        {/* brand */}
        <Link to={hasTwin ? '/dashboard' : '/'} className="flex items-center gap-2">
          <BrandMark className="h-9 w-9" />
          <span className="text-lg font-extrabold tracking-tight">
            <span className="text-brand-500">Twin</span>
            <span className="text-risk-calm">state</span>
          </span>
        </Link>

        {/* center pill nav */}
        {hasTwin && (
          <nav className="hidden items-center gap-1 rounded-full border border-ink/5 bg-white/80 p-1 shadow-card md:flex">
            {TABS.map((t) => {
              const active = pathname === t.to
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    active ? 'bg-brand-grad text-white shadow-soft' : 'text-slate-soft hover:text-ink'
                  }`}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white/90" />}
                  {t.label}
                </Link>
              )
            })}
          </nav>
        )}

        {/* right actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/faq"
            className={`hidden rounded-full px-3.5 py-1.5 text-sm font-semibold sm:inline ${
              pathname === '/faq' ? 'bg-brand-grad text-white shadow-soft' : 'text-slate-soft hover:text-ink'
            }`}
          >
            FAQ
          </Link>

          {dataSourceLabel === 'live' && (
            <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 lg:inline">
              ● live data
            </span>
          )}

          {session && (
            <div className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white py-1 pl-1 pr-1.5 shadow-card">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-grad text-[11px] font-bold text-white">
                {firstName?.[0]?.toUpperCase() || '?'}
              </span>
              <span className="hidden max-w-[80px] truncate text-sm font-semibold sm:inline">{firstName}</span>
              <button
                onClick={onSwitch}
                title="Switch user"
                className="rounded-full px-2 py-1 text-xs font-semibold text-slate-soft transition hover:bg-cream hover:text-brand-600"
              >
                Switch
              </button>
            </div>
          )}
        </div>
      </div>

      {/* mobile tab bar */}
      {hasTwin && (
        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3 no-scrollbar md:hidden">
          {TABS.map((t) => {
            const active = pathname === t.to
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                  active ? 'bg-brand-grad text-white shadow-soft' : 'bg-white/80 text-slate-soft'
                }`}
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-white/90" />}
                {t.label}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
