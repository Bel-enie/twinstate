/**
 * Deterministic "peer" of the AI analysis, in the SAME output shape.
 *
 * This is the instant baseline the UI renders before AI returns, and the
 * automatic fallback when AI is off or unreachable. Because it produces an
 * identical assessment object, the app never blocks and never dead-ends —
 * the numbers just come from the formula instead of the model.
 */
import { ORGANS } from '../mock/mockData.js'
import {
  SEVERITY_BASE,
  SEVERITY_WEIGHT,
  deriveTwinState,
  computeOrganRisk,
  computeOverall,
  computeOrganExposure,
  normalizeItems,
} from '../mock/engine.js'
import { simulationMock } from '../mock/simulation.mock.js'

const ORGAN_KEYS = Object.keys(ORGANS)
const clamp = (n) => Math.max(6, Math.min(100, Math.round(n)))

/** Intensity (0–100) for an organ from its severity baseline + sub-clinical exposure. */
function organIntensity(severity, exposure) {
  return clamp((SEVERITY_BASE[severity] ?? SEVERITY_BASE.calm) + (exposure || 0))
}

/**
 * Build a full assessment from an ALREADY-COMPUTED flag list + the raw items.
 * This is the shared shape whether the flags came from our rule engine or from
 * HOLON's real clinical knowledge — so one code path drives the whole UI.
 */
export function assessFromFlags(rawItems = [], flags = [], source = 'engine') {
  const organRisk = computeOrganRisk(flags)
  const exposure = computeOrganExposure(rawItems)

  const organs = {}
  const values = []
  for (const key of ORGAN_KEYS) {
    const sev = organRisk[key]?.severity || 'calm'
    const intensity = organIntensity(sev, exposure[key])
    organs[key] = { severity: sev, flagCount: organRisk[key]?.flagCount || 0, intensity, note: '' }
    values.push(intensity)
  }

  const worst = values.length ? Math.max(...values) : 6
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 6
  const bodyIndex = clamp(worst * 0.7 + avg * 0.3)

  return {
    organRisk: organs,
    flags,
    overall: computeOverall(flags),
    bodyIndex,
    headline: '',
    source,
  }
}

/** Full deterministic assessment for the given logged items (our rule engine). */
export function engineAssess(rawItems = []) {
  return assessFromFlags(rawItems, deriveTwinState(rawItems).flags, 'engine')
}

export { SEVERITY_WEIGHT }

/** Deterministic two-path projection (delegates to the existing simulation). */
export async function engineProject({ organRisk, items, weeks }) {
  return simulationMock.simulate({ organRisk, items, weeks })
}

export { ORGAN_KEYS, normalizeItems }
