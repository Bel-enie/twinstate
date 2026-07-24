import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AnatomyModel from '../components/anatomy/AnatomyModel.jsx'
import Button from '../components/ui/Button.jsx'
import BrandMark from '../components/ui/BrandMark.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { listProfiles, removeProfile } from '../services/storage.js'
import { dataSourceLabel } from '../services/index.js'
import { PERSONAS } from '../services/mock/mockData.js'

const PREVIEW_RISK = {
  heart: { severity: 'watch' },
  liver: { severity: 'caution' },
}

export default function Welcome() {
  const { isSignedIn, signIn, resumeAccount, loadPersona } = useTwin()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [accounts, setAccounts] = useState(() => listProfiles())

  // Already signed in? Let the Boot route decide where to send them.
  if (isSignedIn) return <Navigate to="/" replace />

  const canContinue = name.trim().length > 0 && !busy

  const onSubmit = (e) => {
    e.preventDefault()
    if (!canContinue) return
    const { hasTwin } = signIn(name)
    navigate(hasTwin ? '/dashboard' : '/', { replace: true })
  }

  const onResume = (key) => {
    const { ok, hasTwin } = resumeAccount(key)
    if (ok) navigate(hasTwin ? '/dashboard' : '/', { replace: true })
  }

  const onDeleteAccount = (key) => {
    removeProfile(key)
    setAccounts((prev) => prev.filter((a) => a.key !== key))
  }

  const onPersona = async (id) => {
    setBusy(true)
    const ok = await loadPersona(id)
    if (ok) navigate('/dashboard', { replace: true })
    else setBusy(false)
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl items-center gap-8 md:grid-cols-2">
        {/* Left: intro + form */}
        <div className="animate-floatIn">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-9 w-9" />
            <span className="text-lg font-extrabold tracking-tight">
              <span className="text-brand-500">Twin</span>
              <span className="text-risk-calm">state</span>
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Your <span className="text-risk-calm">ultimate</span> health twin.
          </h1>
          <p className="mt-2 text-base font-semibold text-brand-700 sm:text-lg">
            Track what you take and see its real effect on your body.
          </p>
          <p className="mt-3 max-w-md text-slate-soft">
            Log your meds, energy drinks and supplements, and Twinstate shows what they're doing to
            your organs in plain language, checked against real clinical drug-interaction knowledge.
          </p>

          <form onSubmit={onSubmit} className="mt-6">
            <label htmlFor="name" className="text-sm font-bold">
              What should we call you?
            </label>
            <p className="mb-2 mt-0.5 text-xs text-slate-soft">
              We'll personalise your dashboard with this name.
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-full border border-ink/10 bg-white p-1.5 shadow-card transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <input
                id="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beloved"
                className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-base outline-none"
              />
              <button
                type="submit"
                disabled={!canContinue}
                className={`shrink-0 rounded-full bg-brand-grad px-5 py-2.5 text-sm font-semibold text-white transition ${
                  canContinue ? 'shadow-glow hover:brightness-105' : 'opacity-50'
                }`}
              >
                Continue →
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-soft">
              Your data stays in this browser and picks up where you left off.
            </p>
          </form>

          {/* Live-demo shortcut: jump straight into a persona */}
          <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Live demo · jump into a ready-made student
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPersona(p.id)}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-sm font-semibold shadow-soft transition hover:bg-white/60 disabled:opacity-50"
                >
                  <span className={`h-5 w-5 rounded-full bg-gradient-to-br ${p.avatarTone}`} />
                  {p.name.split(',')[0]}
                </button>
              ))}
            </div>
            {busy && <p className="mt-2 text-xs text-slate-soft">Building twin…</p>}
          </div>

          {/* Return-visit: resume a saved account */}
          {accounts.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-soft">
                Continue where you left off
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <div
                    key={a.key}
                    className="group flex items-center gap-1 rounded-full border border-ink/10 bg-white pl-1.5 pr-1 hover:bg-brand-50"
                  >
                    <button
                      onClick={() => onResume(a.key)}
                      className="flex items-center gap-2 py-1.5 pl-1 pr-1 text-sm font-semibold"
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[10px] text-white">
                        {a.name?.trim()?.[0]?.toUpperCase() || '?'}
                      </span>
                      {a.name?.split(',')[0] || 'Guest'}
                      {a.personaId && <span className="text-[10px] text-slate-soft">demo</span>}
                    </button>
                    <button
                      onClick={() => onDeleteAccount(a.key)}
                      aria-label={`Remove ${a.name?.split(',')[0] || 'account'}`}
                      title="Remove this profile"
                      className="grid h-6 w-6 place-items-center rounded-full text-slate-soft transition hover:bg-rose-100 hover:text-rose-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: 3D anatomy teaser */}
        <div className="order-first md:order-none">
          <div className="stage-backdrop mx-auto flex aspect-[3/4] max-w-[260px] items-center justify-center rounded-[2rem] p-4 shadow-soft">
            <AnatomyModel organRisk={PREVIEW_RISK} compact />
          </div>
          <p className="mt-3 text-center text-xs text-slate-soft">
            {dataSourceLabel === 'holon'
              ? 'Live HOLON clinical data'
              : dataSourceLabel === 'live'
                ? 'Live Ontomorph data'
                : 'Interactive 3D twin'}{' '}
            · drag to rotate
          </p>
        </div>
      </div>
    </div>
  )
}
