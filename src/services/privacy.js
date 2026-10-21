/**
 * What happens to the user's data, stated from the actual configuration — so
 * the privacy claim can never be truer on screen than it is in the code.
 *
 *  - No AI and no HOLON key: everything stays in this browser.
 *  - Chat proxy / OpenAI key: what you log is sent to OpenAI to write answers.
 *  - HOLON key: substance names are sent to Ontomorph to look them up.
 *
 * Also owns the "export everything" and "delete everything" actions.
 */
import { hasAIChat, hasChatProxy, hasHolon } from './config.js'

const PREFIXES = ['ontomorph:', 'twinstate:']

export const sendsData = hasAIChat || hasHolon

/** Who receives what, in plain words. Empty when nothing leaves the browser. */
export function recipients() {
  const out = []
  if (hasAIChat) {
    out.push({
      who: hasChatProxy ? 'OpenAI, through the app’s server' : 'OpenAI',
      what: 'what you logged, to write the plain-language answers',
    })
  }
  if (hasHolon) out.push({ who: 'Ontomorph HOLON', what: 'substance names, to look up interactions' })
  return out
}

/** One sentence for footers and hero lines. */
export function privacyLine() {
  if (!sendsData) return 'Everything you log stays in this browser. There is no Twinstate account server.'
  const r = recipients()
  return `Your log is saved in this browser. To work, it is also sent to ${r
    .map((x) => x.who)
    .join(' and ')}.`
}

function ourKeys() {
  const keys = []
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && PREFIXES.some((p) => k.startsWith(p))) keys.push(k)
    }
  } catch {
    /* storage blocked: nothing to list */
  }
  return keys
}

export const hasStoredData = () => ourKeys().length > 0

/** Everything Twinstate stored on this device, as one JSON file download. */
export function exportAllData() {
  const data = {}
  for (const k of ourKeys()) {
    try {
      const raw = localStorage.getItem(k)
      try {
        data[k] = JSON.parse(raw)
      } catch {
        data[k] = raw
      }
    } catch {
      /* skip unreadable key */
    }
  }
  const payload = {
    app: 'Twinstate',
    exportedAt: new Date().toISOString(),
    note: 'Everything Twinstate stored in this browser. Educational tool, not a medical record.',
    data,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `twinstate-data-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Remove every saved twin, the sign-in pointer, consent and early-access
 * signups, then reload on the home page so nothing in memory can write any
 * of it back. Returns false if the user cancels the confirmation.
 */
export function deleteAllData() {
  const ok = window.confirm(
    'Delete everything Twinstate saved in this browser? This removes every saved twin and cannot be undone.'
  )
  if (!ok) return false
  for (const k of ourKeys()) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  }
  window.location.assign('/')
  return true
}
