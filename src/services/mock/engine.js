/**
 * Interaction engine — the mock stand-in for HOLON's rule evaluation.
 * Pure functions so the "live" client can return the same shapes later.
 */
import { SUBSTANCE_BY_ID, INTERACTION_RULES, ORGANS } from './mockData.js'

export const SEVERITY_WEIGHT = { calm: 0, watch: 1, caution: 2, urgent: 3 }
export const SEVERITY_ORDER = ['calm', 'watch', 'caution', 'urgent']

// Starting "today" stress implied by a severity level (0–100). Shared by the
// What-If simulation and the body-stress index so every screen agrees.
export const SEVERITY_BASE = { calm: 14, watch: 42, caution: 66, urgent: 84 }

/** Parse "x3/day" | "3" | 3 -> 3. Defaults to 1. */
export function frequencyToTimes(freq) {
  if (typeof freq === 'number') return freq
  if (!freq) return 1
  const m = String(freq).match(/(\d+(\.\d+)?)/)
  return m ? Number(m[1]) : 1
}

/**
 * Attach the catalog definition to each raw logged item.
 * Falls back to a definition carried ON the item (`it.def`) for dynamic
 * substances resolved from HOLON / AI that aren't in the built-in catalog —
 * so anything a student adds still flows through interactions + analysis.
 */
export function normalizeItems(items = []) {
  return items
    .map((it) => {
      const def = SUBSTANCE_BY_ID[it.substanceId] || it.def
      if (!def || !Array.isArray(def.tags)) return null
      return {
        ...it,
        times: frequencyToTimes(it.frequency ?? it.times),
        def,
      }
    })
    .filter(Boolean)
}

/** Build the evaluation context the rules query. */
export function buildContext(rawItems) {
  const items = normalizeItems(rawItems)

  const hasTag = (tag) => items.some((it) => it.def.tags.includes(tag))
  const tagSources = (tag) => [
    ...new Set(items.filter((it) => it.def.tags.includes(tag)).map((it) => it.substanceId)),
  ]
  const dailyMg = (substanceId) =>
    items
      .filter((it) => it.substanceId === substanceId)
      .reduce((sum, it) => sum + (Number(it.dose) || 0) * it.times, 0)
  const totalCaffeine = () =>
    items
      .filter((it) => it.def.tags.includes('caffeine'))
      .reduce(
        (sum, it) => sum + (it.def.caffeinePerUnit || 0) * (Number(it.dose) || 1) * it.times,
        0
      )

  return { items, hasTag, tagSources, dailyMg, totalCaffeine }
}

/** Run all rules against logged items -> list of flags. */
export function evaluateInteractions(rawItems) {
  const ctx = buildContext(rawItems)
  // Label lookup that also covers dynamic (HOLON/AI-resolved) substances.
  const labelOf = Object.fromEntries(ctx.items.map((it) => [it.substanceId, it.def.label]))
  const flags = []

  for (const rule of INTERACTION_RULES) {
    let fired = false
    try {
      fired = rule.test(ctx)
    } catch {
      fired = false
    }
    if (!fired) continue

    const substanceIds = (rule.substancesFrom ? rule.substancesFrom(ctx) : [])
      .filter((id, i, arr) => arr.indexOf(id) === i)

    flags.push({
      id: rule.id,
      title: rule.title,
      organ: rule.organ,
      organLabel: ORGANS[rule.organ]?.label ?? rule.organ,
      severity: rule.severity,
      substances: substanceIds.map((id) => ({
        id,
        label: labelOf[id] ?? SUBSTANCE_BY_ID[id]?.label ?? id,
      })),
      reason: rule.reason,
      saferAlternative: rule.saferAlternative,
      reference: rule.reference,
      sources: rule.sources || [],
    })
  }

  // Highest severity first.
  flags.sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity])
  return flags
}

/** Roll flags up into a per-organ risk map for the anatomy renderer. */
export function computeOrganRisk(flags) {
  const organRisk = {}
  for (const key of Object.keys(ORGANS)) organRisk[key] = { severity: 'calm', flagCount: 0 }

  for (const flag of flags) {
    const cur = organRisk[flag.organ]
    if (!cur) continue
    cur.flagCount += 1
    if (SEVERITY_WEIGHT[flag.severity] > SEVERITY_WEIGHT[cur.severity]) {
      cur.severity = flag.severity
    }
  }
  return organRisk
}

/** Overall twin status = worst organ. */
export function computeOverall(flags) {
  if (!flags.length) return 'calm'
  return flags.reduce(
    (worst, f) => (SEVERITY_WEIGHT[f.severity] > SEVERITY_WEIGHT[worst] ? f.severity : worst),
    'calm'
  )
}

/**
 * Sub-clinical organ "exposure" (0–25) from what's logged, independent of whether
 * a hard interaction flag fired. This gives each organ a realistic, data-grounded
 * baseline so unflagged organs aren't all identical — caffeine loads the heart &
 * brain, paracetamol the liver, NSAIDs the stomach & kidneys, etc.
 */
const EXPOSURE_WEIGHTS = {
  heart: { caffeine: 1.0, stimulant: 0.5 },
  brain: { caffeine: 0.6, opioid: 1.0, cns_depressant: 0.8, serotonergic: 0.7, ssri: 0.6 },
  liver: { hepatotoxic: 1.0, analgesic: 0.3, herbal_unknown: 0.8 },
  kidneys: { nsaid: 0.8, dehydrating: 0.6 },
  stomach: { nsaid: 1.0, gastro_irritant: 0.6 },
}

export function computeOrganExposure(rawItems) {
  const items = normalizeItems(rawItems)
  const out = {}
  for (const organ of Object.keys(ORGANS)) {
    const w = EXPOSURE_WEIGHTS[organ] || {}
    let raw = 0
    for (const it of items) {
      for (const tag of it.def.tags) if (w[tag]) raw += w[tag] * (it.times || 1)
    }
    // saturating curve so heavy use plateaus rather than exploding
    out[organ] = Math.round(25 * (1 - Math.exp(-raw / 6)))
  }
  return out
}

/**
 * Derive the full twin state (flags + organ risk + overall) from raw logged
 * items in one synchronous, deterministic pass. This is the single source of
 * truth so that risk scores, the 3D visuals, the simulation and the history
 * timeline can never drift apart — change the substance list or a rule here and
 * every screen recalculates identically.
 */
export function deriveTwinState(rawItems) {
  const flags = evaluateInteractions(rawItems)
  return {
    flags,
    organRisk: computeOrganRisk(flags),
    overall: computeOverall(flags),
  }
}

/**
 * Current whole-body stress index (0–100) from what's logged: each organ's
 * severity baseline + its sub-clinical exposure, rolled up worst-weighted. Same
 * math the What-If simulation starts from, so the dashboard, the trend chart and
 * the simulation never disagree.
 */
export function computeBodyIndex(rawItems) {
  const { organRisk } = deriveTwinState(rawItems)
  const exposure = computeOrganExposure(rawItems)
  const values = Object.keys(ORGANS).map((k) =>
    Math.max(6, Math.min(100, SEVERITY_BASE[organRisk[k]?.severity || 'calm'] + (exposure[k] || 0)))
  )
  const worst = Math.max(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return Math.round(Math.max(6, Math.min(100, worst * 0.7 + avg * 0.3)))
}

/**
 * Per-day body-stress trend for the history timeline, ANCHORED so its most
 * recent point equals the twin's current body-stress index (`current`, which
 * on the dashboard may be the AI-calculated value). The engine computes each
 * day's relative load, then the whole series is scaled so "today" matches the
 * number shown on the twin — guaranteeing History and the dashboard never
 * disagree, in AI mode or engine-only mode.
 *
 * @param {Array<{day, items}>} history newest-last
 * @param {number} current the canonical current body-stress index
 * @returns {Array<{label, value}>}
 */
export function scaledBodyTrend(history = [], current) {
  if (!history.length) return []
  const raw = history.map((d) => computeBodyIndex(d.items))
  const last = raw[raw.length - 1] || 0
  const cur = Number.isFinite(current) ? current : last
  const k = last > 0 ? cur / last : 1
  return history.map((d, i) => ({
    label: d.day,
    value:
      i === history.length - 1
        ? Math.round(cur)
        : Math.max(6, Math.min(100, Math.round(raw[i] * k))),
  }))
}
