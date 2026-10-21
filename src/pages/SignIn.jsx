import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Lock, Mail } from 'lucide-react'
import Aurora from '../components/landing/ui/Aurora.jsx'
import ShimmerButton from '../components/landing/ui/ShimmerButton.jsx'
import BrandMark from '../components/ui/BrandMark.jsx'
import Wordmark from '../components/ui/Wordmark.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { authErrorMessage, createAccount, sendReset, signInWithEmail, signInWithGoogle } from '../services/auth.js'
import { STORY_PERSONA } from '../components/landing/twinData.js'

/** Only same-site paths are accepted as a destination (no open redirects). */
const safeNext = (v) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '')

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

const FIELD =
  'w-full rounded-full border border-ink/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-soft/70 focus:border-violet-400 focus:ring-2 focus:ring-violet-200'

export default function SignIn() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const auth = useAuth()
  const { session, hasTwin, signIn, loadPersona, status } = useTwin()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'reset'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [demoBusy, setDemoBusy] = useState(false)

  // Once the account is signed in and synced, go where they were heading.
  useEffect(() => {
    if (!auth.enabled || !auth.user || session?.authUid !== auth.user.uid) return
    navigate(next || (hasTwin ? '/dashboard' : '/intake'), { replace: true })
  }, [auth.enabled, auth.user, session, hasTwin, next, navigate])

  const run = async (fn) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await fn()
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const onGoogle = () => run(() => signInWithGoogle())

  const onEmail = (e) => {
    e.preventDefault()
    if (mode === 'reset') {
      return run(async () => {
        await sendReset(email)
        setNotice('If that email has an account, a reset link is on its way. Check your inbox.')
        setMode('signin')
      })
    }
    if (mode === 'signup') return run(() => createAccount(name, email, password))
    return run(() => signInWithEmail(email, password))
  }

  // Fallback when Firebase isn't configured: the first-name sign-in.
  const onName = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const { hasTwin: had } = signIn(name)
    navigate(next || (had ? '/dashboard' : '/intake'), { replace: true })
  }

  const onDemo = async () => {
    setDemoBusy(true)
    const ok = await loadPersona(STORY_PERSONA)
    if (ok) navigate('/dashboard')
    else setDemoBusy(false)
  }

  const title = mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Sign in to your twin'
  const sub =
    mode === 'reset'
      ? 'Enter your email and we’ll send you a link to choose a new password.'
      : mode === 'signup'
        ? 'Create an account to build your twin and open your dashboard.'
        : 'Sign in to build your twin and open your dashboard.'

  return (
    <div className="relative min-h-full overflow-x-clip bg-paper">
      <Aurora />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col px-5 py-8 sm:py-14">
        <Link to="/" className="mb-8 inline-flex items-center gap-1 self-start text-sm font-semibold text-violet-600 hover:text-violet-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Twinstate
        </Link>

        <div className="rounded-[30px] bg-[linear-gradient(140deg,rgba(58,102,216,0.45),rgba(124,92,240,0.3)_40%,rgba(217,70,126,0.4))] p-px shadow-[0_30px_80px_-40px_rgba(76,58,160,0.55)]">
          <div className="rounded-[29px] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-10 w-10" />
              <Wordmark className="text-xl" />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold leading-tight">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-soft">{sub}</p>

            {auth.enabled ? (
              <>
                {mode !== 'reset' && (
                  <>
                    <button
                      type="button"
                      onClick={onGoogle}
                      disabled={busy}
                      className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-card transition hover:border-violet-300 hover:shadow-soft disabled:opacity-60"
                    >
                      <GoogleMark /> Continue with Google
                    </button>
                    <div className="my-5 flex items-center gap-3 text-xs text-slate-soft">
                      <span className="h-px flex-1 bg-ink/10" />
                      or use your email
                      <span className="h-px flex-1 bg-ink/10" />
                    </div>
                  </>
                )}

                <form onSubmit={onEmail} className={`space-y-3 ${mode === 'reset' ? 'mt-6' : ''}`}>
                  {mode === 'signup' && (
                    <label className="block">
                      <span className="sr-only">First name</span>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" autoComplete="given-name" className={FIELD} />
                    </label>
                  )}
                  <label className="block">
                    <span className="sr-only">Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      autoComplete="email"
                      required
                      className={FIELD}
                    />
                  </label>
                  {mode !== 'reset' && (
                    <label className="block">
                      <span className="sr-only">Password</span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Choose a password (6+ characters)' : 'Password'}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        required
                        minLength={6}
                        className={FIELD}
                      />
                    </label>
                  )}

                  {error && (
                    <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
                      {error}
                    </p>
                  )}
                  {notice && (
                    <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
                      {notice}
                    </p>
                  )}

                  <ShimmerButton type="submit" disabled={busy} className="w-full py-3">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in with email'}
                  </ShimmerButton>
                </form>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                  {mode === 'signin' && (
                    <>
                      <button type="button" onClick={() => { setMode('signup'); setError('') }} className="font-semibold text-violet-600 hover:underline">
                        New here? Create an account
                      </button>
                      <button type="button" onClick={() => { setMode('reset'); setError('') }} className="text-slate-soft hover:text-ink">
                        Forgot password?
                      </button>
                    </>
                  )}
                  {mode !== 'signin' && (
                    <button type="button" onClick={() => { setMode('signin'); setError('') }} className="font-semibold text-violet-600 hover:underline">
                      Already have an account? Sign in
                    </button>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={onName} className="mt-6 space-y-3">
                <label className="block">
                  <span className="text-sm font-semibold">What should we call you?</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" className={`${FIELD} mt-2`} />
                </label>
                <ShimmerButton type="submit" disabled={!name.trim()} className="w-full py-3">
                  Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ShimmerButton>
                {import.meta.env.DEV && (
                  <p className="rounded-2xl bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
                    Developer note: Google and email sign-in switch on once the VITE_FIREBASE_* values are set in
                    .env.local. Until then, a first name is the sign-in.
                  </p>
                )}
              </form>
            )}

            <p className="mt-6 flex items-start gap-2 border-t border-ink/10 pt-4 text-xs leading-relaxed text-slate-soft">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" aria-hidden="true" />
              {auth.enabled
                ? 'Sign-in is handled by Google Firebase, which receives only your name and email. Your health log stays in this browser.'
                : 'Your health log stays in this browser.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDemo}
          disabled={demoBusy || status === 'building'}
          className="mt-6 self-center text-sm font-semibold text-slate-soft transition hover:text-violet-700 disabled:opacity-60"
        >
          {demoBusy ? 'Opening the demo…' : 'Just looking? Open the Cora demo instead →'}
        </button>
      </div>
    </div>
  )
}
