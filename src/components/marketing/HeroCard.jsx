import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../ui/BrandMark.jsx'
import DashboardMockup from './DashboardMockup.jsx'
import { useTwin } from '../../context/TwinContext.jsx'
import { listProfiles, removeProfile } from '../../services/storage.js'
import { PERSONAS } from '../../services/mock/mockData.js'

/**
 * The dark hero card that floats on the light page: nav, the pitch, the way
 * in (name sign-in + sample twins), and the product mockup hanging off its
 * bottom edge into the next section.
 *
 * The overlap is a negative bottom margin on the mockup; whatever section
 * follows must reserve matching top padding (see Landing.jsx).
 */

const NAV = [
  ['#how', 'How it works'],
  ['#safety', 'Safety'],
  ['#faq', 'FAQ'],
]

export default function HeroCard() {
  const navigate = useNavigate()
  const { signIn, resumeAccount, loadPersona, status, session } = useTwin()

  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [accounts, setAccounts] = useState(() => listProfiles())

  const building = busy || status === 'building'
  const canContinue = name.trim().length > 0 && !building
  const firstName = session?.name?.split(',')[0]

  const onSubmit = (e) => {
    e.preventDefault()
    if (!canContinue) return
    const { hasTwin } = signIn(name)
    navigate(hasTwin ? '/dashboard' : '/intake')
  }

  const onResume = (key) => {
    const { ok, hasTwin } = resumeAccount(key)
    if (ok) navigate(hasTwin ? '/dashboard' : '/intake')
  }

  const onDeleteAccount = (key) => {
    removeProfile(key)
    setAccounts((prev) => prev.filter((a) => a.key !== key))
  }

  const onPersona = async (id) => {
    setBusy(true)
    const ok = await loadPersona(id)
    if (ok) navigate('/dashboard')
    else setBusy(false)
  }

  return (
    <section className="px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="hero-card relative mx-auto max-w-[1200px] rounded-[2rem] px-4 pt-4 text-frost sm:rounded-[2.5rem] sm:px-8 sm:pt-6">
        {/* ── Nav ─────────────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="text-base font-extrabold tracking-tight">
              <span className="text-brand-300">Twin</span>
              <span className="text-risk-calm">state</span>
            </span>
          </a>
          <div className="hidden items-center gap-6 md:flex">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium text-mist transition hover:text-frost">
                {label}
              </a>
            ))}
          </div>
          <button
            onClick={() => onPersona('beloved')}
            disabled={building}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition hover:bg-brand-50 disabled:opacity-60"
          >
            {building ? 'Loading…' : 'See a demo'}
          </button>
        </nav>

        {/* ── Pitch + the way in ──────────────────────────────────────── */}
        <div className="mx-auto mt-12 max-w-3xl text-center sm:mt-16">
          {firstName && (
            <span className="mb-4 inline-flex rounded-full border border-brand-400/25 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
              Hi {firstName} 👋 — let's build your twin
            </span>
          )}
          <h1 className="font-display text-[42px] leading-[1.02] tracking-tight sm:text-6xl md:text-[68px]">
            See what your meds, energy drinks &amp; supplements do to your body{' '}
            <em className="text-brand-300">— as a living twin.</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
            Log what you take. Twinstate builds a 3D twin of you, screens it against real clinical
            drug-interaction knowledge, and explains the risk like a friend who knows medicine.
          </p>

          <form
            onSubmit={onSubmit}
            className="mx-auto mt-7 flex max-w-md items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] p-1.5 backdrop-blur transition focus-within:border-brand-400/60 focus-within:ring-2 focus-within:ring-brand-500/25"
          >
            <label htmlFor="name" className="sr-only">
              What should we call you?
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-base text-frost outline-none placeholder:text-mist/60"
            />
            <button
              type="submit"
              disabled={!canContinue}
              className={`shrink-0 rounded-full bg-brand-grad px-5 py-2.5 text-sm font-semibold text-white transition ${
                canContinue ? 'shadow-halo hover:brightness-110' : 'opacity-45'
              }`}
            >
              Start my twin →
            </button>
          </form>
          <p className="mt-2.5 text-xs text-mist/80">
            No password, no email. Your data stays in this browser.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-mist">Or explore a sample twin</span>
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => onPersona(p.id)}
                disabled={building}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-1.5 pr-3 text-xs font-semibold transition hover:border-brand-400/50 hover:bg-white/10 disabled:opacity-50"
              >
                <span className={`h-4 w-4 rounded-full bg-gradient-to-br ${p.avatarTone}`} />
                {p.name.split(',')[0]}
              </button>
            ))}
          </div>

          {accounts.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-mist">Continue where you left off</span>
              {accounts.map((a) => (
                <div
                  key={a.key}
                  className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.05] pl-1.5 pr-1"
                >
                  <button
                    onClick={() => onResume(a.key)}
                    className="flex items-center gap-1.5 py-1 pl-0.5 pr-1 text-xs font-semibold"
                  >
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-[9px] text-white">
                      {a.name?.trim()?.[0]?.toUpperCase() || '?'}
                    </span>
                    {a.name?.split(',')[0] || 'Guest'}
                    {a.personaId && <span className="text-[10px] text-mist/70">demo</span>}
                  </button>
                  <button
                    onClick={() => onDeleteAccount(a.key)}
                    aria-label={`Remove ${a.name?.split(',')[0] || 'account'}`}
                    title="Remove this profile"
                    className="grid h-5 w-5 place-items-center rounded-full text-[10px] text-mist transition hover:bg-risk-urgent/20 hover:text-risk-urgent"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── The mockup, hanging off the bottom edge ─────────────────── */}
        <div className="relative z-10 mx-auto -mb-24 mt-10 w-[96%] max-w-[1040px] sm:-mb-32 sm:mt-14 lg:-mb-44">
          <DashboardMockup />
        </div>
      </div>
    </section>
  )
}
