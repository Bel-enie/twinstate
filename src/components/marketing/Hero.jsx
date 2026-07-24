import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../ui/BrandMark.jsx'
import LiveTwin from './LiveTwin.jsx'
import { useTwin } from '../../context/TwinContext.jsx'
import { listProfiles, removeProfile } from '../../services/storage.js'

/**
 * Nav + hero. Left: the pitch and the way in. Right (~55%): the live twin.
 *
 * There are no accounts — a first name is the whole "sign in" and it stays in
 * this browser — so the nav never says "Sign in". "Build my twin" reveals the
 * name field in place; a saved profile gets a "Resume" instead. `wantName` is
 * owned by Landing so the final CTA can open the same field.
 */

const NAV = [
  ['#product', 'Product'],
  ['#evidence', 'Science'],
  ['#trust', 'Security'],
]

export default function Hero({ story, wantName, onBuild, onSelectFlag, selectedOrgan, onSelectOrgan }) {
  const navigate = useNavigate()
  const { signIn, resumeAccount, loadPersona, status } = useTwin()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [accounts, setAccounts] = useState(() => listProfiles())
  const inputRef = useRef(null)

  const building = busy || status === 'building'
  const canContinue = name.trim().length > 0 && !building
  const latest = accounts[0] || null

  useEffect(() => {
    if (wantName) inputRef.current?.focus()
  }, [wantName])

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

  const onDelete = (key) => {
    removeProfile(key)
    setAccounts((prev) => prev.filter((a) => a.key !== key))
  }

  const onDemo = async () => {
    setBusy(true)
    const ok = await loadPersona(story.persona.id)
    if (ok) navigate('/dashboard')
    else setBusy(false)
  }

  return (
    <>
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          <span className="text-base font-extrabold tracking-tight">
            <span className="text-brand-600">Twin</span>
            <span className="text-risk-calm">state</span>
          </span>
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-medium text-slate-soft transition hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {latest && (
            <button
              onClick={() => onResume(latest.key)}
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-soft transition hover:text-ink sm:block"
            >
              Resume {latest.name?.split(',')[0] || 'twin'}
            </button>
          )}
          <button onClick={onBuild} className="btn-specular rounded-full px-4 py-2 text-sm font-semibold">
            Build my twin
          </button>
        </div>
      </header>

      <section
        id="hero"
        data-mood="hero"
        className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[45fr_55fr] lg:gap-14 lg:pt-16"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Your living health twin
          </p>
          <h1 className="mt-4 font-display text-[44px] leading-[1.02] tracking-tight sm:text-6xl lg:text-[64px]">
            Your health has a past.
            <br />
            Twinstate gives it a <em>living present.</em>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-soft sm:text-lg">
            Log what you take — prescriptions, painkillers, energy drinks, supplements, how you
            slept. Twinstate builds a continuously updating model of your body so you can see what
            changed, why it changed, and what deserves your attention.
          </p>

          {wantName ? (
            <form onSubmit={onSubmit} className="mt-8 max-w-md">
              <label htmlFor="name" className="text-sm font-semibold">
                What should we call you?
              </label>
              <div className="input-glass mt-2 flex items-center gap-2 rounded-[16px] p-1.5">
                <input
                  ref={inputRef}
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base outline-none placeholder:text-slate-soft/70"
                />
                <button
                  type="submit"
                  disabled={!canContinue}
                  className="btn-specular shrink-0 rounded-[12px] px-4 py-2.5 text-sm font-semibold"
                >
                  Build my twin →
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-soft">
                No account, no password — a first name is all it takes, and it stays in this browser.
              </p>
            </form>
          ) : (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={onBuild} className="btn-specular rounded-[14px] px-5 py-3 text-sm font-semibold">
                Build my twin
              </button>
              <button
                onClick={onDemo}
                disabled={building}
                className="btn-glass rounded-[14px] px-5 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {building ? 'Opening…' : `See ${story.firstName}'s twin live →`}
              </button>
            </div>
          )}

          {accounts.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-soft">
              <span>Continue where you left off:</span>
              {accounts.map((a) => (
                <span key={a.key} className="inline-flex items-center gap-0.5 rounded-full border border-ink/10 bg-white/70 pl-2.5 pr-1">
                  <button onClick={() => onResume(a.key)} className="py-1 font-semibold text-ink">
                    {a.name?.split(',')[0] || 'Guest'}
                    {a.personaId && <span className="ml-1 font-normal text-slate-soft">demo</span>}
                  </button>
                  <button
                    onClick={() => onDelete(a.key)}
                    aria-label={`Remove ${a.name?.split(',')[0] || 'account'}`}
                    className="grid h-5 w-5 place-items-center rounded-full text-[10px] text-slate-soft hover:bg-rose-50 hover:text-rose-700"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <LiveTwin
          story={story}
          onSelectFlag={onSelectFlag}
          selectedOrgan={selectedOrgan}
          onSelectOrgan={onSelectOrgan}
        />
      </section>
    </>
  )
}
