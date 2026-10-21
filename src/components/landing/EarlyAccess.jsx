import { useState } from 'react'
import { addSignup } from '../../services/earlyAccess.js'
import ShimmerButton from './ui/ShimmerButton.jsx'
import Reveal from './ui/Reveal.jsx'
import AnimatedGradientText from './ui/AnimatedGradientText.jsx'
import BuildTwinCta from './BuildTwinCta.jsx'

const ROLES = [
  { id: 'student', label: 'Student' },
  { id: 'health_worker', label: 'Health worker' },
  { id: 'other', label: 'Other' },
]

/**
 * Early-access signup, restyled. Same working service as before: signups
 * persist to localStorage and the confirmation says so honestly — there is no
 * server or mailing list behind it.
 */
export default function EarlyAccess() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('student')
  const [state, setState] = useState({ status: 'idle', message: '' })

  const onSubmit = (e) => {
    e.preventDefault()
    const res = addSignup({ email, role })
    if (res.ok) {
      setState({ status: 'done', message: "You're on the list." })
      setEmail('')
      return
    }
    setState({
      status: 'error',
      message:
        res.reason === 'duplicate'
          ? 'That email is already on the list.'
          : 'Please enter a valid email address.',
    })
  }

  return (
    <section id="access" className="mx-auto max-w-[1200px] scroll-mt-24 px-5 py-20 sm:px-8">
      <Reveal>
        <div className="rounded-[30px] bg-[linear-gradient(130deg,#3A66D8,#7C5CF0,#D9467E)] p-px shadow-[0_24px_80px_-28px_rgba(124,92,240,0.55)]">
          <div className="grid gap-10 rounded-[29px] bg-white/95 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-balance font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
                Know what your mix is doing{' '}
                <AnimatedGradientText>before it adds up.</AnimatedGradientText>
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-slate-soft">
                Build a twin right now, no signup needed. Or leave an email for when Twinstate
                opens up beyond the demo.
              </p>
              <BuildTwinCta className="mt-7" />
            </div>

            {state.status === 'done' ? (
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/60 p-5" role="status" aria-live="polite">
                <p className="text-sm font-semibold">{state.message}</p>
                <p className="mt-1 text-xs text-slate-soft">
                  Saved in this browser only. Twinstate has no server collecting emails. You can
                  build a twin right now; no signup needed.
                </p>
                <button
                  onClick={() => setState({ status: 'idle', message: '' })}
                  className="mt-2 text-xs font-semibold text-violet-600 hover:text-violet-700"
                >
                  Add another →
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      aria-pressed={role === r.id}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                        role === r.id
                          ? 'border-transparent bg-[linear-gradient(110deg,#3A66D8,#8B5CF6)] text-white'
                          : 'border-ink/15 text-slate-soft hover:border-violet-300 hover:text-ink'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (state.status === 'error') setState({ status: 'idle', message: '' })
                    }}
                    placeholder="you@university.edu"
                    aria-label="Email address"
                    aria-invalid={state.status === 'error'}
                    className="min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-5 py-3 text-sm outline-none transition placeholder:text-slate-soft/70 focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                  />
                  <ShimmerButton type="submit" className="shrink-0 px-5 py-3">
                    Notify me
                  </ShimmerButton>
                </div>

                {state.status === 'error' && (
                  <p className="mt-2 text-xs text-rose-700" role="alert">
                    {state.message}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
