/**
 * ─────────────────────────────────────────────────────────────────────────
 *  LIVE ADAPTER (wire-up template — not active by default)
 * ─────────────────────────────────────────────────────────────────────────
 *  When you have a real key and the SDKs installed, set VITE_DATA_SOURCE=live
 *  in .env.local and implement the calls below. The method SIGNATURES must
 *  match the mock clients so the UI never changes.
 *
 *  Install:  npm i @ontomorph/dtp-sdk @ontomorph/holon-client
 *
 *  Example (pseudo — adjust to the real SDK surface):
 *
 *    import { DtpClient } from '@ontomorph/dtp-sdk'
 *    import { HolonClient } from '@ontomorph/holon-client'
 *    const dtp = new DtpClient({ apiKey: config.apiKey, baseUrl: config.apiUrl })
 *    const holon = new HolonClient({ apiKey: config.apiKey })
 * ─────────────────────────────────────────────────────────────────────────
 */
import { config } from '../config.js'

const notWired = (name) => {
  throw new Error(
    `[Ontomorph live] "${name}" is not wired up yet. Implement it in ` +
      `src/services/live/liveClients.js and set VITE_DATA_SOURCE=live with a valid key.`
  )
}

/**
 * Thin REST helper for HOLON. Reads the key from config (never the UI).
 *
 * ⚠️ CONFIRM AGAINST THE BRIEF: the endpoint PATHS below are a sensible REST
 * convention, not verified against the real HOLON API. Once you have the
 * hackathon docs, adjust the three paths + the response mapping and this is
 * live. Auth is assumed to be a Bearer token — change if the brief differs.
 */
async function holonFetch(path, { method = 'GET', body } = {}) {
  const base = config.apiUrl.replace(/\/$/, '')
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) throw new Error(`HOLON ${method} ${path} → ${res.status}`)
  return res.json()
}

// Each of these must return the SAME shape as its mock counterpart.
export const liveHolon = {
  /** Full substance catalog → [{ id, label, category, unit, typicalDose, aliases, tags }]. */
  async getCatalog() {
    const data = await holonFetch('/holon/substances')
    return (data.substances || data || []).map(mapSubstance)
  },

  /** Search HOLON's concept graph for a substance → same shape as getCatalog rows. */
  async search(query) {
    const q = encodeURIComponent(String(query || '').trim())
    if (!q) return []
    const data = await holonFetch(`/holon/substances/search?q=${q}`)
    return (data.results || data.substances || data || []).map(mapSubstance)
  },

  /** Interaction check → [flags] in the engine's flag shape. */
  async lookupInteractions(items) {
    const data = await holonFetch('/holon/interactions', { method: 'POST', body: { items } })
    return (data.flags || data.interactions || []).map(mapFlag)
  },
}

// ── Response mappers (adjust keys to the real HOLON payload) ─────────────────
function mapSubstance(s = {}) {
  return {
    id: s.id || s.rxcui || s.code,
    label: s.label || s.name || s.display,
    category: s.category || 'otc',
    tags: s.tags || s.classes || [],
    unit: s.unit || 'dose',
    typicalDose: s.typicalDose ?? s.defaultDose ?? 1,
    caffeinePerUnit: s.caffeinePerUnit,
    aliases: s.aliases || s.synonyms || [],
    note: s.note || s.description || '',
  }
}
function mapFlag(f = {}) {
  return {
    id: f.id || f.code,
    title: f.title || f.label,
    organ: f.organ || f.system,
    organLabel: f.organLabel || f.systemLabel || f.organ,
    severity: f.severity || 'watch',
    substances: (f.substances || []).map((x) => ({ id: x.id || x.code, label: x.label || x.name })),
    reason: f.reason || f.description,
    saferAlternative: f.saferAlternative || f.recommendation,
    reference: f.reference || f.source,
    sources: f.sources || [],
  }
}

export const liveDtp = {
  async createTwin() {
    return notWired('dtp.createTwin')
  },
  async getTwinState() {
    return notWired('dtp.getTwinState')
  },
}

export const liveAi = {
  async explainFlag() {
    return notWired('ai.explainFlag')
  },
  async summarizeTwin() {
    return notWired('ai.summarizeTwin')
  },
  async recommend() {
    return notWired('ai.recommend')
  },
}

export const liveSimulation = {
  async simulate() {
    return notWired('simulation.simulate')
  },
}

// Surface the config so it's obvious the key flows through here (never UI).
export const liveMeta = { usingKey: Boolean(config.apiKey), apiUrl: config.apiUrl }
