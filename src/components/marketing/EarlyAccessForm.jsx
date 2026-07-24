import { useState } from 'react'
import { addSignup } from '../../services/earlyAccess.js'

const ROLES = [
  { id: 'student', label: 'Student' },
  { id: 'health_worker', label: 'Health worker' },
  { id: 'other', label: 'Other' },
]

/**
 * Working early-access form. Signups persist to localStorage (see
 * services/earlyAccess.js) — the confirmation says so explicitly rather than
 * implying a real mailing list, because nothing leaves the browser.
 */
export default function EarlyAccessForm({ compact = false }) {
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
          ? "That email is already on the list."
          : 'Please enter a valid email address.',
    })
  }

  if (state.status === 'done') {
    return (
      <div
        className="panel-dark flex items-start gap-3 p-5"
        role="status"
        aria-live="polite"
      >
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-risk-calm/15 text-sm text-risk-calm">
          ✓
        </span>
        <div>
          <p className="font-bold text-frost">{state.message}</p>
          <p className="mt-1 text-sm text-mist">
            Saved in this browser only — Twinstate has no server collecting emails. You can start
            using the twin right now, no signup needed.
          </p>
          <button
            onClick={() => setState({ status: 'idle', message: '' })}
            className="mt-2 text-sm font-semibold text-brand-400 hover:text-brand-300"
          >
            Add another →
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className={compact ? '' : 'panel-dark p-6 sm:p-7'}>
      {!compact && (
        <>
          <h3 className="text-xl font-bold text-frost">Get early access</h3>
          <p className="mt-1.5 text-sm text-mist">
            Twinstate is a student project from the Ontomorph Hackathon. Leave your email and we'll
            tell you when it opens up properly.
          </p>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            aria-pressed={role === r.id}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              role === r.id
                ? 'border-brand-400/60 bg-brand-500/15 text-brand-300'
                : 'border-hairline text-mist hover:border-brand-400/40 hover:text-frost'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
          className="min-w-0 flex-1 rounded-full border border-hairline bg-deep/80 px-5 py-3 text-base text-frost outline-none transition placeholder:text-mist/55 focus:border-brand-400/70 focus:ring-2 focus:ring-brand-500/25"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-brand-grad px-6 py-3 text-sm font-semibold text-white shadow-halo transition hover:brightness-110"
        >
          Notify me →
        </button>
      </div>

      {state.status === 'error' && (
        <p className="mt-2 text-sm text-risk-urgent" role="alert">
          {state.message}
        </p>
      )}
      {state.status !== 'error' && (
        <p className="mt-2 text-xs text-mist/75">
          Stored in your browser only. No mailing list, no third party.
        </p>
      )}
    </form>
  )
}
