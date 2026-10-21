import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ShimmerButton from './ui/ShimmerButton.jsx'
import { useTwin } from '../../context/TwinContext.jsx'

/**
 * The hero's way in, reusable anywhere on the page: a gradient "Build my
 * twin" button beside the persona demo. The button opens the name field in
 * place — a first name is the whole sign-in — so nobody is scrolled away.
 */
export default function BuildTwinCta({ demoName, demoBusy, onDemo, align = 'start', className = '' }) {
  const navigate = useNavigate()
  const { signIn, status } = useTwin()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  const building = demoBusy || status === 'building'
  const canContinue = name.trim().length > 0 && !building

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const onSubmit = (e) => {
    e.preventDefault()
    if (!canContinue) return
    const { hasTwin } = signIn(name)
    navigate(hasTwin ? '/dashboard' : '/intake')
  }

  const justify = align === 'center' ? 'justify-center' : 'justify-start'

  if (open) {
    return (
      <form onSubmit={onSubmit} className={`w-full max-w-md ${className}`}>
        <label htmlFor="cta-name" className="text-sm font-semibold">
          What should we call you?
        </label>
        <div className="mt-2 rounded-full bg-[linear-gradient(110deg,#3A66D8,#7C5CF0,#D9467E)] p-px">
          <div className="flex min-w-0 items-center gap-2 rounded-full bg-white p-1.5">
            <input
              ref={inputRef}
              id="cta-name"
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
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${justify} ${className}`}>
      <ShimmerButton onClick={() => setOpen(true)} className="px-7 py-3.5">
        Build my twin
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </ShimmerButton>
      {onDemo && (
        <button
          onClick={onDemo}
          disabled={building}
          className="rounded-full border border-ink/15 bg-white/80 px-6 py-3.5 text-sm font-semibold text-ink shadow-card backdrop-blur transition hover:border-violet-300 hover:shadow-soft disabled:opacity-60"
        >
          {building ? 'Opening…' : `See ${demoName}'s twin live →`}
        </button>
      )}
    </div>
  )
}
