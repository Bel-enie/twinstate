/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Lightweight "demo account" persistence — localStorage only, no backend.
 * ─────────────────────────────────────────────────────────────────────────
 *  - A single "current user" pointer remembers who is signed in.
 *  - Each identity (a typed name, or a persona) gets its own profile record
 *    holding the whole twin state, so a refresh never wipes progress.
 *  No passwords — this just makes the demo feel like a real logged-in account.
 * ─────────────────────────────────────────────────────────────────────────
 */
const NS = 'ontomorph:v1'
const CURRENT_KEY = `${NS}:current`
const profileKey = (key) => `${NS}:profile:${key}`

// Guard against private-mode / disabled storage so the app never crashes.
function safe(fn, fallback = null) {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export function slugify(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Namespaced key for a human-typed name vs a built-in persona. */
export const userKey = (name) => `user:${slugify(name) || 'guest'}`
export const personaKeyOf = (personaId) => `persona:${personaId}`

// ── current-user pointer ──────────────────────────────────────────────────
export const getCurrentKey = () => safe(() => localStorage.getItem(CURRENT_KEY))
export const setCurrentKey = (key) =>
  safe(() => localStorage.setItem(CURRENT_KEY, key))
export const clearCurrentKey = () => safe(() => localStorage.removeItem(CURRENT_KEY))

// ── profile records ───────────────────────────────────────────────────────
export function getProfile(key) {
  return safe(() => {
    const raw = localStorage.getItem(profileKey(key))
    return raw ? JSON.parse(raw) : null
  })
}

export function saveProfile(key, record) {
  safe(() => localStorage.setItem(profileKey(key), JSON.stringify(record)))
}

export function removeProfile(key) {
  safe(() => localStorage.removeItem(profileKey(key)))
}

/** All saved accounts, newest-updated first — powers "resume" on the gate. */
export function listProfiles() {
  return safe(() => {
    const out = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith(`${NS}:profile:`)) {
        const rec = JSON.parse(localStorage.getItem(k))
        if (rec) out.push(rec)
      }
    }
    return out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }, [])
}
