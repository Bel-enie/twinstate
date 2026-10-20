import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTwin } from '../../context/TwinContext.jsx'
import { dataSourceLabel } from '../../services/index.js'
import { useStuck } from '../../utils/useStuck.js'
import BrandMark from '../ui/BrandMark.jsx'
import Wordmark from '../ui/Wordmark.jsx'

const TABS = [
  { to: '/dashboard', label: 'Twin' },
  { to: '/history', label: 'History' },
  { to: '/what-if', label: 'What-If' },
  { to: '/recommendation', label: 'Next step' },
]

export default function Header() {
  const { hasTwin, session, signOut } = useTwin()
  const stuck = useStuck()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const firstName = session?.name?.split(',')[0]

  const onSwitch = () => {
    signOut()
    navigate('/')
  }

  return (
    <header
      data-stuck={stuck}
      className="site-header sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4"
    >
      <div className="site-pill mx-auto w-full max-w-6xl justify-between gap-3 py-2 pl-3 pr-2 sm:pl-4 sm:pr-3">
        {/* brand */}
        <Link to={hasTwin ? '/dashboard' : '/'} className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9" />
          <Wordmark className="text-lg" />
        </Link>

        {/* center pill nav */}
        {hasTwin && (
          <nav
            aria-label="Twin sections"
            className="hidden items-center gap-1 rounded-full border border-violet-100 bg-white/85 p-1 shadow-card md:flex"
          >
            {TABS.map((t) => {
              const active = pathname === t.to
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-brand-grad text-white shadow-[0_8px_22px_-10px_rgba(124,92,240,0.7)]'
                      : 'text-slate-soft hover:bg-violet-50 hover:text-ink'
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
                className="rounded-full px-2 py-1 text-xs font-semibold text-slate-soft transition hover:bg-shell hover:text-brand-600"
              >
                Switch
              </button>
            </div>
          )}
        </div>
      </div>

      {/* mobile tab bar */}
      {hasTwin && (
        <nav
          aria-label="Twin sections"
          className="mx-auto mt-2 flex w-full max-w-6xl gap-1.5 overflow-x-auto pb-1 no-scrollbar md:hidden"
        >
          {TABS.map((t) => {
            const active = pathname === t.to
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-current={active ? 'page' : undefined}
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
