import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import AnimatedGradientText from './ui/AnimatedGradientText.jsx'
import ShimmerButton from './ui/ShimmerButton.jsx'
import Reveal from './ui/Reveal.jsx'
import HeroTwin from './HeroTwin.jsx'
import { privacyLine } from '../../services/privacy.js'
import { useTwin } from '../../context/TwinContext.jsx'
import { listProfiles, removeProfile } from '../../services/storage.js'
import { authEnabled } from '../../services/auth.js'

/**
 * Centered gradient hero. Carries the app's whole "auth": a first name is the
 * sign-in, saved profiles can be resumed, and the persona demo opens Cora.
 * Deleting a profile now takes two taps (the old single 20px ✕ was an audit
 * finding) and the targets meet the 24px minimum.
 */
export default function Hero({ story, wantName, onBuild, demoBusy, onDemo }) {
  const navigate = useNavigate()
  const { signIn, resumeAccount, status } = useTwin()
  const [name, setName] = useState('')
  // With real sign-in, saved profiles are not listed: they open only after signing in.
  const [accounts, setAccounts] = useState(() => (authEnabled ? [] : listProfiles()))
  const [confirmKey, setConfirmKey] = useState(null)
  const inputRef = useRef(null)

  const building = demoBusy || status === 'building'
  const canContinue = name.trim().length > 0 && !building

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
    if (confirmKey !== key) {
      setConfirmKey(key)
      return
    }
    removeProfile(key)
    setAccounts((prev) => prev.filter((a) => a.key !== key))
    setConfirmKey(null)
  }

  return (
    <section id="hero" className="relative mx-auto max-w-[920px] px-5 pb-14 pt-14 text-center sm:px-8 sm:pt-20">
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-4 py-1.5 text-xs font-semibold shadow-card backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />
          <AnimatedGradientText>A digital twin of what you take</AnimatedGradientText>
        </span>
      </Reveal>

      <Reveal delay={0.08}>
        <h1 className="mx-auto mt-6 max-w-[18ch] text-balance pb-1 font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[80px]">
          Every pill, drink and dose.{' '}
          <AnimatedGradientText>Checked together.</AnimatedGradientText>
        </h1>
      </Reveal>

      <Reveal delay={0.16}>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-soft sm:text-lg">
          Log what you take: prescriptions, painkillers, energy drinks, supplements. Twinstate
          checks the combination against known interactions, shows where it adds up on a 3D body,
          and tells you what to ask a pharmacist.
        </p>
      </Reveal>

      <Reveal delay={0.24}>
        {wantName ? (
          <form onSubmit={onSubmit} className="mx-auto mt-9 max-w-md text-left">
            <label htmlFor="hero-name" className="text-sm font-semibold">
              What should we call you?
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-full bg-[linear-gradient(110deg,#3A66D8,#7C5CF0,#D9467E)] p-px">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white p-1.5">
                <input
                  ref={inputRef}
                  id="hero-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base outline-none placeholder:text-slate-soft/70"
                />
                <ShimmerButton type="submit" disabled={!canContinue} className="shrink-0 px-4 py-2.5">
                  Build my twin
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ShimmerButton>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-soft">
              No account, no password. A first name is all it takes, and it stays in this browser.
            </p>
          </form>
        ) : (
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <ShimmerButton onClick={onBuild} className="px-7 py-3.5">
              Build my twin
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ShimmerButton>
            <button
              onClick={onDemo}
              disabled={building}
              className="rounded-full border border-ink/15 bg-white/80 px-6 py-3.5 text-sm font-semibold text-ink shadow-card backdrop-blur transition hover:border-violet-300 hover:shadow-soft disabled:opacity-60"
            >
              {building ? 'Opening…' : `See ${story.firstName}'s twin live →`}
            </button>
          </div>
        )}
      </Reveal>

      {accounts.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-soft">
          <span>Continue where you left off:</span>
          {accounts.map((a) => {
            const first = a.name?.split(',')[0] || 'Guest'
            const confirming = confirmKey === a.key
            return (
              <span
                key={a.key}
                className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white/80 pl-3 pr-1 shadow-card"
              >
                <button onClick={() => onResume(a.key)} className="py-1.5 font-semibold text-ink">
                  {first}
                  {a.personaId && <span className="ml-1 font-normal text-slate-soft">demo</span>}
                </button>
                <button
                  onClick={() => onDelete(a.key)}
                  onBlur={() => confirming && setConfirmKey(null)}
                  aria-label={confirming ? `Confirm removing ${first}` : `Remove ${first}`}
                  className={
                    confirming
                      ? 'rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white'
                      : 'grid h-6 w-6 place-items-center rounded-full text-[11px] text-slate-soft hover:bg-rose-50 hover:text-rose-700'
                  }
                >
                  {confirming ? 'Sure?' : '✕'}
                </button>
              </span>
            )
          })}
        </div>
      )}

      <p className="mt-8 text-xs text-slate-soft/80">
        Educational demo, not medical advice. {privacyLine()}
      </p>

      <HeroTwin story={story} />
    </section>
  )
}
