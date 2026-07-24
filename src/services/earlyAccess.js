/**
 * Early-access signups — localStorage only, no backend.
 *
 * Deliberately consistent with the rest of Twinstate's persistence (see
 * storage.js): nothing leaves the browser, so there's no third-party service
 * and no secret in the bundle. That also means a signup exists only in the
 * browser that made it — the UI says so rather than implying a mailing list.
 */
const KEY = 'ontomorph:v1:earlyAccess'

function safe(fn, fallback = null) {
  try {
    return fn()
  } catch {
    return fallback
  }
}

/** Minimal, forgiving email shape check — we only guard obvious typos. */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim())
}

export function listSignups() {
  return safe(() => {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  }, [])
}

/**
 * Record a signup.
 * @returns {{ok: boolean, reason?: 'invalid'|'duplicate', total: number}}
 */
export function addSignup({ email, role = 'student' }) {
  const clean = String(email || '').trim().toLowerCase()
  if (!isValidEmail(clean)) return { ok: false, reason: 'invalid', total: listSignups().length }

  const all = listSignups()
  if (all.some((s) => s.email === clean)) {
    return { ok: false, reason: 'duplicate', total: all.length }
  }

  const next = [...all, { email: clean, role, at: Date.now() }]
  safe(() => localStorage.setItem(KEY, JSON.stringify(next)))
  return { ok: true, total: next.length }
}
