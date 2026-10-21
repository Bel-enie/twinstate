import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileText,
  Info,
  FlaskConical,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Search,
  Settings,
  Trash2,
  UserRoundPen,
} from 'lucide-react'
import { useTwin } from '../../context/TwinContext.jsx'
import { dataSourceLabel } from '../../services/index.js'
import { useStuck } from '../../utils/useStuck.js'
import { deleteAllData, exportAllData } from '../../services/privacy.js'
import BrandMark from '../ui/BrandMark.jsx'
import Wordmark from '../ui/Wordmark.jsx'

const TABS = [
  { to: '/dashboard', label: 'Twin', icon: LayoutGrid, match: (p) => p === '/dashboard' || p.startsWith('/interaction/') },
  { to: '/history', label: 'History', icon: CalendarDays },
  { to: '/what-if', label: 'What-If', icon: FlaskConical },
  { to: '/recommendation', label: 'Next step', icon: ClipboardCheck },
]

const ROUND = 'grid h-11 w-11 place-items-center rounded-full border border-ink/10 bg-white text-ink/80 shadow-card transition hover:border-violet-300 hover:text-violet-700'

/**
 * Dashboard header: brand, a centre tab pill (the active tab is a white pill
 * with its icon), then search, the flag bell, settings and the account block
 * with a menu. Phones get a scrolling tab bar underneath instead.
 */
export default function Header() {
  const { hasTwin, session, flags, signOut } = useTwin()
  const stuck = useStuck()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [q, setQ] = useState('')
  const menuRef = useRef(null)

  const firstName = session?.name?.split(',')[0]
  const isPersona = Boolean(session?.personaId)
  const flagCount = flags?.length || 0

  useEffect(() => {
    if (!menu) return undefined
    const onDoc = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false)
    const onKey = (e) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  const onSwitch = () => {
    setMenu(false)
    signOut()
    navigate('/')
  }

  const onSearch = (e) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/dashboard?q=${encodeURIComponent(term)}` : '/dashboard')
  }

  return (
    <header data-stuck={stuck} className="site-header sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="site-pill mx-auto w-full max-w-6xl justify-between gap-3 py-2 pl-3 pr-2 sm:pl-5 sm:pr-3">
        {/* brand */}
        <Link to={hasTwin ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2.5">
          <BrandMark className="h-10 w-10" />
          <Wordmark className="text-xl" />
        </Link>

        {/* centre tab pill */}
        {hasTwin && (
          <nav aria-label="Twin sections" className="hidden items-center rounded-full bg-paper p-1 md:flex">
            {TABS.map(({ to, label, icon: Icon, match }) => {
              const active = match ? match(pathname) : pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    active ? 'bg-white text-ink shadow-card' : 'text-slate-soft hover:text-ink'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-violet-600' : 'text-slate-soft/80'}`} aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>
        )}

        {/* right: search, bell, settings, account */}
        <div className="flex items-center gap-2">
          {hasTwin && (
            <form onSubmit={onSearch} role="search" className="hidden lg:block">
              <label className="flex h-11 items-center gap-2 rounded-full border border-ink/10 bg-white pl-4 pr-3 shadow-card focus-within:border-violet-400">
                <Search className="h-4 w-4 text-slate-soft" aria-hidden="true" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search your log"
                  aria-label="Search substances and flags in your twin"
                  className="w-36 bg-transparent text-sm outline-none placeholder:text-slate-soft/70 xl:w-44"
                />
              </label>
            </form>
          )}

          {hasTwin && (
            <button
              type="button"
              onClick={() => navigate('/dashboard#flags')}
              aria-label={flagCount ? `${flagCount} active flag${flagCount === 1 ? '' : 's'}` : 'No active flags'}
              className={`relative hidden sm:grid ${ROUND}`}
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
              {flagCount > 0 && (
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-risk-caution ring-2 ring-white" aria-hidden="true" />
              )}
            </button>
          )}

          {session && (
            <div ref={menuRef} className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMenu((m) => !m)}
                aria-expanded={menu}
                aria-haspopup="menu"
                aria-label="Settings"
                className={`hidden sm:grid ${ROUND}`}
              >
                <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setMenu((m) => !m)}
                aria-expanded={menu}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-ink/10 bg-white py-1 pl-1 pr-2.5 shadow-card transition hover:border-violet-300"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-grad text-xs font-bold text-white">
                  {firstName?.[0]?.toUpperCase() || '?'}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[110px] truncate text-sm font-semibold leading-tight">{firstName}</span>
                  <span className="block text-[11px] leading-tight text-slate-soft">{isPersona ? 'Demo persona' : 'Student'}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-slate-soft" aria-hidden="true" />
              </button>

              {menu && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-ink/10 bg-white p-1.5 shadow-soft"
                >
                  <Link to="/intake" role="menuitem" onClick={() => setMenu(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-violet-50">
                    <UserRoundPen className="h-4 w-4 text-violet-600" aria-hidden="true" /> Edit my twin
                  </Link>
                  {hasTwin && (
                    <Link to="/summary" role="menuitem" onClick={() => setMenu(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-violet-50">
                      <FileText className="h-4 w-4 text-violet-600" aria-hidden="true" /> Summary for a pharmacist
                    </Link>
                  )}
                  <Link to="/limits" role="menuitem" onClick={() => setMenu(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-violet-50">
                    <Info className="h-4 w-4 text-violet-600" aria-hidden="true" /> How it works &amp; limits
                  </Link>
                  <Link to="/faq" role="menuitem" onClick={() => setMenu(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-violet-50">
                    <HelpCircle className="h-4 w-4 text-violet-600" aria-hidden="true" /> FAQ
                  </Link>
                  <div className="my-1 border-t border-ink/5" />
                  <button type="button" role="menuitem" onClick={() => { setMenu(false); exportAllData() }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-violet-50">
                    <Download className="h-4 w-4 text-violet-600" aria-hidden="true" /> Export my data
                  </button>
                  <button type="button" role="menuitem" onClick={onSwitch} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-violet-50">
                    <LogOut className="h-4 w-4 text-violet-600" aria-hidden="true" /> Switch user
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setMenu(false); deleteAllData() }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete all my data
                  </button>
                  <p className="border-t border-ink/5 px-3 pb-1 pt-2 text-[11px] text-slate-soft">
                    Data source: {dataSourceLabel === 'mock' ? 'demo rules' : dataSourceLabel}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* mobile tab bar */}
      {hasTwin && (
        <nav aria-label="Twin sections" className="mx-auto mt-2 flex w-full max-w-6xl gap-1 overflow-x-auto rounded-full border border-ink/10 bg-white/90 p-1 shadow-card backdrop-blur no-scrollbar md:hidden">
          {[...TABS, { to: '/faq', label: 'FAQ', icon: HelpCircle }].map(({ to, label, icon: Icon, match }) => {
            const active = match ? match(pathname) : pathname === to
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-semibold ${
                  active ? 'bg-brand-grad text-white shadow-card' : 'text-slate-soft'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-soft/80'}`} aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
