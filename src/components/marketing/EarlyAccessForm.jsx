import { useState } from 'react'
import { addSignup } from '../../services/earlyAccess.js'

const ROLES = [
  { id: 'student', label: 'Student' },
  { id: 'health_worker', label: 'Health worker' },
  { id: 'other', label: 'Other' },
]

/**
 * Working early-access form, on a light surface. Signups persist to
 * localStorage (services/earlyAccess.js) — the confirmation says so explicitly
 * rather than implying a mailing list, because nothing leaves the browser.
 */
export default function EarlyAccessForm() {
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

  if (state.status === 'done') {
    return (
      <div className="card-glass flex items-start gap-3 rounded-[22px] p-4" role="status" aria-live="polite">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs text-emerald-700">
          ✓
        </span>
        <div>
          <p className="text-sm font-semibold">{state.message}</p>
          <p className="mt-1 text-xs text-slate-soft">
            Saved in this browser only — Twinstate has no server collecting emails. You can build a
            twin right now; no signup needed.
          </p>
          <button
            onClick={() => setState({ status: 'idle', message: '' })}
            className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Add another →
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            aria-pressed={role === r.id}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              role === r.id
                ? 'border-ink bg-ink text-white'
                : 'border-ink/15 text-slate-soft hover:border-ink/40 hover:text-ink'
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
          className="input-glass min-w-0 flex-1 rounded-[14px] px-4 py-2.5 text-sm outline-none placeholder:text-slate-soft/70"
        />
        <button
          type="submit"
          className="btn-specular shrink-0 rounded-[14px] px-4 py-2.5 text-sm font-semibold"
        >
          Notify me
        </button>
      </div>

      <p className={`mt-2 text-xs ${state.status === 'error' ? 'text-rose-700' : 'text-slate-soft'}`} role={state.status === 'error' ? 'alert' : undefined}>
        {state.status === 'error' ? state.message : 'Stored in your browser only. No mailing list, no third party.'}
      </p>
    </form>
  )
}
