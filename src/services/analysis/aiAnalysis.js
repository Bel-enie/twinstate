/**
 * AI-calculated twin stats.
 *
 * Reasons over each student's logged substances + symptoms with OpenAI and
 * returns the organ scores, body-stress index, interaction flags and What-If
 * projections that drive the whole app. Order of execution:
 *   1. secure proxy   (VITE_CHAT_PROXY_URL — key stays server-side)
 *   2. direct OpenAI   (VITE_OPENAI_API_KEY — dev only, key in browser)
 *   3. deterministic engine (always available — the baseline & fallback)
 *
 * Every AI response is validated and clamped into the exact shape the engine
 * produces, and real interaction citations are merged back in, so AI numbers
 * can never break the UI or strip the sourced safety information.
 */
import { hasHolon } from '../config.js'
import { ORGANS, SUBSTANCES, SYMPTOMS } from '../mock/mockData.js'
import { SEVERITY_ORDER, SEVERITY_WEIGHT, normalizeItems } from '../mock/engine.js'
import { buildAnalyzeMessages, buildProjectMessages } from './prompts.js'
import { engineAssess, engineProject, assessFromFlags } from './enginePeer.js'
import { holonLive } from '../live/holonLive.js'
import { requestJson, aiAvailable } from './aiTransport.js'

const ORGAN_KEYS = Object.keys(ORGANS)
const SYMPTOM_LABEL = Object.fromEntries(SYMPTOMS.map((s) => [s.id, s.label]))
const clamp = (n, lo = 6, hi = 100) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)))
const isSev = (s) => SEVERITY_ORDER.includes(s)
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Severity → allowed intensity band (kept in sync with prompts.js).
const BAND = { calm: [6, 33], watch: [34, 57], caution: [58, 77], urgent: [78, 100] }
function intoBand(intensity, severity) {
  const [lo, hi] = BAND[severity] || BAND.calm
  return Math.max(lo, Math.min(hi, clamp(intensity, lo, hi)))
}

// ── payload builders ───────────────────────────────────────────────────────
function itemsPayload(rawItems) {
  return normalizeItems(rawItems).map((it) => ({
    name: it.def.label.split(' (')[0],
    category: it.def.category,
    tags: it.def.tags,
    dosePerTake: Number(it.dose) || it.def.typicalDose || 1,
    unit: it.def.unit,
    timesPerDay: it.times,
    ...(it.def.caffeinePerUnit ? { caffeinePerUnitMg: it.def.caffeinePerUnit } : {}),
  }))
}

// ── substance-name → catalog {id,label} (best effort, never throws) ──────────
function matchSubstance(name) {
  const n = String(name || '').toLowerCase().trim()
  if (!n) return null
  const hit = SUBSTANCES.find(
    (s) =>
      s.label.toLowerCase().includes(n) ||
      n.includes(s.id) ||
      (s.aliases || []).some((a) => n.includes(a.toLowerCase()))
  )
  return hit ? { id: hit.id, label: hit.label } : { id: slug(name), label: name }
}

// ── validate + clamp + merge citations back in ───────────────────────────────
function normalizeAssessment(ai, baseline, rawItems) {
  if (!ai || typeof ai !== 'object') return baseline

  // Organs. The NUMBERS are the deterministic engine's — the model never
  // originates a clinical score, it may only escalate a severity band (below)
  // and write the prose note. Every figure on screen is therefore reproducible
  // from the rules alone, which is what a clinical reviewer will ask for.
  const organRisk = {}
  for (const key of ORGAN_KEYS) {
    const a = ai.organs?.[key]
    const base = baseline.organRisk[key]
    // An AI severity may only move UP (safety), never down.
    const severity =
      isSev(a?.severity) && SEVERITY_WEIGHT[a.severity] > SEVERITY_WEIGHT[base.severity]
        ? a.severity
        : base.severity
    const intensity = intoBand(base.intensity, severity)
    organRisk[key] = { severity, flagCount: 0, intensity, note: (a?.note || '').toString().slice(0, 160) }
  }

  // Flags from AI
  const seen = new Set()
  const flags = []
  for (const f of Array.isArray(ai.flags) ? ai.flags : []) {
    const organ = ORGAN_KEYS.includes(f?.organ) ? f.organ : null
    if (!organ || !f?.title || !isSev(f?.severity) || f.severity === 'calm') continue
    const substances = (Array.isArray(f.substances) ? f.substances : []).map(matchSubstance).filter(Boolean)
    const subIds = new Set(substances.map((s) => s.id))
    // Merge curated citations from any engine flag on this organ sharing a substance.
    const sources = []
    for (const bf of baseline.flags) {
      if (bf.organ !== organ) continue
      // Only inherit a curated citation when the AI flag actually shares a
      // substance with the rule-fired flag. Previously a flag with NO matched
      // substance inherited every source on the organ, which could park an
      // NHS/FDA link under a claim the model wrote by itself.
      const overlaps = bf.substances.some((s) => subIds.has(s.id))
      if (overlaps) {
        for (const src of bf.sources || []) if (!sources.some((x) => x.url === src.url)) sources.push(src)
      }
    }
    let id = `${slug(f.title)}-${organ}` || `flag-${flags.length}`
    while (seen.has(id)) id += 'x'
    seen.add(id)
    flags.push({
      id,
      title: String(f.title).slice(0, 90),
      organ,
      organLabel: ORGANS[organ].label,
      severity: f.severity,
      substances,
      reason: String(f.reason || '').slice(0, 600),
      saferAlternative: String(f.saferAlternative || '').slice(0, 400),
      reference: String(f.reference || '').slice(0, 160),
      sources,
      source: 'ai',
    })
  }

  // Safety net: never DROP a rule-fired flag the AI missed (esp. urgent ones).
  for (const bf of baseline.flags) {
    const covered = flags.some(
      (af) => af.organ === bf.organ && af.substances.some((s) => bf.substances.some((b) => b.id === s.id))
    )
    if (!covered) {
      let id = bf.id
      while (seen.has(id)) id += 'x'
      seen.add(id)
      flags.push({ ...bf, id, source: 'engine' })
    }
  }

  // Flag counts + overall from the final flag set (keeps everything consistent).
  for (const f of flags) if (organRisk[f.organ]) organRisk[f.organ].flagCount += 1
  // Let a flag lift its organ's severity if the AI under-scored it.
  for (const f of flags) {
    const cur = organRisk[f.organ]
    if (cur && SEVERITY_WEIGHT[f.severity] > SEVERITY_WEIGHT[cur.severity]) {
      cur.severity = f.severity
      cur.intensity = intoBand(cur.intensity, f.severity)
    }
  }
  const overall = flags.reduce(
    (w, f) => (SEVERITY_WEIGHT[f.severity] > SEVERITY_WEIGHT[w] ? f.severity : w),
    isSev(ai.overall) ? ai.overall : 'calm'
  )

  return {
    organRisk,
    flags,
    overall,
    // Always the engine's number. The AI cannot move the headline figure.
    bodyIndex: baseline.bodyIndex,
    headline: String(ai.headline || '').slice(0, 220),
    source: 'ai',
  }
}

function normalizeProjection(ai, baseline, weeks) {
  if (!ai || typeof ai !== 'object' || !ai.continue || !ai.safer) return baseline
  // As with the assessment: the projected NUMBERS stay the deterministic
  // model's, and the AI supplies only the headline and detail prose. A
  // projection is an illustrative trend, so letting a model invent its
  // figures would dress a guess up as a measurement.
  const path = (p, fallback) => ({
    organStress: fallback.organStress,
    bodyIndex: fallback.bodyIndex,
    overall: fallback.overall,
    headline: String(p?.headline || fallback.headline).slice(0, 140),
    detail: String(p?.detail || fallback.detail).slice(0, 400),
  })
  return { weeks, continue: path(ai.continue, baseline.continue), safer: path(ai.safer, baseline.safer) }
}

// ── public API ───────────────────────────────────────────────────────────────
export const aiAnalysis = {
  isAI: aiAvailable,

  /**
   * The grounded baseline: REAL HOLON interactions when a HOLON key is set,
   * otherwise our rule engine. Used as the instant result AND (when AI is on)
   * the floor the AI overlays — so HOLON flags + citations always survive.
   */
  async baseline(items = []) {
    if (hasHolon && items.length) {
      try {
        const flags = await holonLive.lookupInteractions(items)
        return assessFromFlags(items, flags, 'holon')
      } catch (err) {
        console.warn('[Twinstate] HOLON baseline failed, using engine:', err.message)
      }
    }
    return engineAssess(items)
  },

  /** Calculate the current twin assessment (organ scores, body index, flags). */
  async assess({ items = [], symptoms = [], profile = {}, name } = {}) {
    const baseline = await this.baseline(items)
    if (!this.isAI || !items.length) return baseline
    try {
      const payload = {
        name,
        profile,
        items: itemsPayload(items),
        symptoms: (symptoms || []).map((s) => SYMPTOM_LABEL[s] || s),
      }
      const ai = await requestJson('analyze', payload, buildAnalyzeMessages)
      return normalizeAssessment(ai, baseline, items)
    } catch (err) {
      console.warn('[Twinstate] AI assess failed, using engine baseline:', err.message)
      return baseline
    }
  },

  /** Project two futures (keep pattern vs rest+hydrate) over `weeks`. */
  async project({ organRisk = {}, items = [], weeks = 2 } = {}) {
    const baseline = await engineProject({ organRisk, items, weeks })
    if (!this.isAI) return baseline
    try {
      const organs = {}
      for (const key of ORGAN_KEYS) organs[key] = organRisk[key]?.intensity ?? baseline.continue.organStress[key]
      const payload = { organs, bodyIndex: baseline.continue.bodyIndex, items: itemsPayload(items), weeks }
      const ai = await requestJson('project', payload, buildProjectMessages)
      return normalizeProjection(ai, baseline, weeks)
    } catch (err) {
      console.warn('[Twinstate] AI project failed, using engine simulation:', err.message)
      return baseline
    }
  },
}
