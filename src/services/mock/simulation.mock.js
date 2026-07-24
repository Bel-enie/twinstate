/**
 * Mock of Ontomorph's simulation endpoint (the "What-If Coach").
 * Projects how each organ's stress evolves under two paths:
 *   - "continue": the student keeps the current pattern
 *   - "safer":    rest + hydration + reduced caffeine / one painkiller
 *
 * Output is a per-organ stress value (0–100) per path per week, plus a short
 * narrative. The What-If view animates the twin between these two states.
 */
import { ORGANS } from './mockData.js'
import { SEVERITY_WEIGHT, SEVERITY_BASE, computeOrganExposure } from './engine.js'

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms))

// Starting stress "today" implied by a severity level (shared source of truth).
const BASE_STRESS = SEVERITY_BASE

const clamp = (n) => Math.max(6, Math.min(100, Math.round(n)))

function severityFromStress(v) {
  if (v >= 78) return 'urgent'
  if (v >= 58) return 'caution'
  if (v >= 34) return 'watch'
  return 'calm'
}

export const simulationMock = {
  /**
   * @param {object} p
   * @param {object} p.organRisk  per-organ {severity} map (from dtp twin state)
   * @param {number} p.weeks      horizon (e.g. 2)
   */
  async simulate({ organRisk, items = [], weeks = 2 }) {
    await delay(650)

    const organs = Object.keys(ORGANS)
    const exposure = computeOrganExposure(items)
    const build = (project) => {
      const organStress = {}
      for (const key of organs) {
        // Start from the flag-severity baseline, then add grounded sub-clinical
        // load so unflagged organs vary by what's actually being taken.
        const base = clamp(BASE_STRESS[organRisk?.[key]?.severity || 'calm'] + (exposure[key] || 0))
        organStress[key] = clamp(project(base, key))
      }
      // Whole-body index = worst organ, lightly averaged.
      const values = Object.values(organStress)
      const worst = Math.max(...values)
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const bodyIndex = clamp(worst * 0.7 + avg * 0.3)
      return { organStress, bodyIndex, overall: severityFromStress(worst) }
    }

    // Continue: stressed organs keep climbing (~10/week), calm ones drift up slowly.
    const cont = build((base) => {
      const ramp = base > BASE_STRESS.watch ? 11 : 4
      return base + ramp * weeks
    })

    // Safer: everything recovers toward a calm baseline (~14/week for stressed).
    const safe = build((base) => {
      const recover = base > BASE_STRESS.watch ? 15 : 6
      return base - recover * weeks
    })

    const worstOrganKey = Object.keys(ORGANS).reduce((a, b) =>
      cont.organStress[a] >= cont.organStress[b] ? a : b
    )
    const worstOrganLabel = ORGANS[worstOrganKey].label

    return {
      weeks,
      continue: {
        ...cont,
        headline: `In ${weeks} weeks, the ${worstOrganLabel.toLowerCase()} takes the most strain`,
        detail: `Keeping this pattern pushes the body-stress index to ${cont.bodyIndex}/100. The climb is gradual, which is exactly why it's easy to miss until symptoms show up.`,
      },
      safer: {
        ...safe,
        headline: `The safer path pulls that stress back down to ${safe.bodyIndex}/100`,
        detail: `Switching to rest, hydration and cutting to one painkiller + less caffeine lets the organs recover. Same two weeks — very different twin.`,
      },
    }
  },
}
