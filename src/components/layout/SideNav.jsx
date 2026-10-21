import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, ClipboardCheck, FlaskConical, HelpCircle, Info, LayoutGrid } from 'lucide-react'
import { useTwin } from '../../context/TwinContext.jsx'

const MAIN = [
  { to: '/dashboard', label: 'Twin', icon: LayoutGrid, match: (p) => p === '/dashboard' || p.startsWith('/interaction/') },
  { to: '/history', label: 'History', icon: CalendarDays },
  { to: '/what-if', label: 'What-If', icon: FlaskConical },
  { to: '/recommendation', label: 'Next step', icon: ClipboardCheck },
]
const MORE = [
  { to: '/limits', label: 'How it works', icon: Info },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
]

function Item({ to, label, icon: Icon, active }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full flex-col items-center gap-1 rounded-2xl px-1.5 py-2.5 text-center transition ${
        active
          ? 'bg-brand-grad text-white shadow-[0_10px_24px_-10px_rgba(124,92,240,0.8)]'
          : 'text-slate-soft hover:bg-violet-50 hover:text-violet-700'
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="text-[11px] font-semibold leading-tight">{label}</span>
    </Link>
  )
}

/**
 * Vertical navigation down the left of the app card (md and up): the four
 * screens in one pill, the help pages in a second. Phones keep the header's
 * scrolling tab bar instead.
 */
export default function SideNav() {
  const { hasTwin } = useTwin()
  const { pathname } = useLocation()
  const isActive = ({ to, match }) => (match ? match(pathname) : pathname === to)

  return (
    <aside
      aria-label="App navigation"
      className="hidden w-[92px] shrink-0 flex-col gap-3 self-start pl-4 md:sticky md:top-28 md:flex lg:pl-6"
    >
      {hasTwin && (
        <nav aria-label="Twin sections" className="flex flex-col gap-1 rounded-3xl border border-ink/10 bg-white/90 p-1.5 shadow-card backdrop-blur">
          {MAIN.map((t) => (
            <Item key={t.to} {...t} active={isActive(t)} />
          ))}
        </nav>
      )}
      <nav aria-label="Help" className="flex flex-col gap-1 rounded-3xl border border-ink/10 bg-white/90 p-1.5 shadow-card backdrop-blur">
        {MORE.map((t) => (
          <Item key={t.to} {...t} active={isActive(t)} />
        ))}
      </nav>
    </aside>
  )
}
