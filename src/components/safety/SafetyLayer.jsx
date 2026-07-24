import { useEffect, useRef, useState } from 'react'

/**
 * Medical safety framework for Twinstate.
 *
 * A consumer health tool has real duties of care. This module supplies:
 *   • ConsentGate       — a one-time, acknowledged "this is not medical advice"
 *                          gate (stored locally) before anyone uses the twin.
 *   • MedicalDisclaimer  — a reusable inline disclaimer for page footers.
 *   • EmergencyNote      — always-available "in an emergency, do this" guidance.
 *
 * None of this replaces clinical governance, but it makes the product's limits
 * explicit and keeps the emergency path one glance away on every screen.
 */

const CONSENT_KEY = 'twinstate:consent:v1'

function readConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

export function EmergencyNote({ className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-risk-urgent/30 bg-risk-urgent/5 px-4 py-3 text-xs leading-relaxed text-ink/80 ${className}`}
    >
      <span className="font-bold text-risk-urgent">In an emergency</span> — chest pain, trouble
      breathing, fainting, a suspected overdose, or thoughts of self-harm — don’t wait on an app.
      Call your local emergency number or go to the nearest emergency department now.
    </div>
  )
}

export function MedicalDisclaimer({ className = '' }) {
  return (
    <p className={`text-xs leading-relaxed text-slate-soft ${className}`}>
      Twinstate is an educational tool, <span className="font-semibold">not a medical device</span>,
      and does not provide diagnosis or personalised prescription advice. Interaction flags are
      general information — always confirm anything about your own medicines with a pharmacist,
      doctor, or your campus health centre.
    </p>
  )
}

export function ConsentGate({ children }) {
  const [accepted, setAccepted] = useState(true) // assume true first paint to avoid flash
  const [ready, setReady] = useState(false)
  const buttonRef = useRef(null)

  useEffect(() => {
    setAccepted(readConsent())
    setReady(true)
  }, [])

  const open = ready && !accepted

  // Standard modal behaviour: lock background scroll and move focus to the
  // primary action while the gate is open; restore scroll on close.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    buttonRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted')
    } catch {
      /* ignore storage failure — still let them through */
    }
    setAccepted(true)
  }

  // Keep focus inside the dialog (only the continue button is focusable, so a
  // Tab press simply keeps it there). Consent is mandatory, so Escape/backdrop
  // clicks intentionally do NOT dismiss.
  const trapFocus = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      buttonRef.current?.focus()
    }
  }

  return (
    <>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-title"
          aria-describedby="consent-desc"
          onKeyDown={trapFocus}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-cream p-6 shadow-shell">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15 text-2xl">
              🩺
            </div>
            <h2 id="consent-title" className="text-lg font-extrabold">
              Before you start
            </h2>
            <div id="consent-desc">
              <p className="mt-2 text-sm leading-relaxed text-ink/80">
                Twinstate helps you <span className="font-semibold">understand</span> how your
                medicines, supplements and energy drinks add up. It’s an educational tool — not a
                doctor, and not a diagnosis.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-ink/75">
                <li className="flex gap-2">
                  <span className="text-brand-500">•</span> Flags are general information, not
                  instructions to change a prescription.
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-500">•</span> Always confirm with a pharmacist or your
                  health centre.
                </li>
              </ul>
              <EmergencyNote className="mt-4" />
            </div>
            <button
              ref={buttonRef}
              onClick={accept}
              className="mt-5 w-full rounded-full bg-brand-grad py-3 text-sm font-bold text-white shadow-soft transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              I understand — continue
            </button>
          </div>
        </div>
      )}
    </>
  )
}
