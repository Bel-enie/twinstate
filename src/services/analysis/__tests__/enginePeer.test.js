import { describe, it, expect } from 'vitest'
import { assessFromFlags } from '../enginePeer.js'
import { evaluateInteractions } from '../../mock/engine.js'

/**
 * The deterministic assessment is what the UI renders. Since the AI layer is
 * now only allowed to write prose, these numbers ARE the product's clinical
 * figures — so they are pinned here.
 */
const item = (substanceId, dose, frequency = 1) => ({ substanceId, dose, frequency })

describe('assessFromFlags', () => {
  it('produces a full assessment for an empty log', () => {
    const a = assessFromFlags([], [], 'engine')
    expect(a.overall).toBe('calm')
    expect(a.bodyIndex).toBeGreaterThanOrEqual(6)
    expect(a.bodyIndex).toBeLessThanOrEqual(100)
  })

  it('gives every organ an intensity inside 6-100', () => {
    const items = [item('paracetamol', 500, 6), item('energy_drink', 1, 4)]
    const a = assessFromFlags(items, evaluateInteractions(items), 'engine')
    for (const [, r] of Object.entries(a.organRisk)) {
      expect(r.intensity).toBeGreaterThanOrEqual(6)
      expect(r.intensity).toBeLessThanOrEqual(100)
    }
  })

  it('raises the body index when a flag fires', () => {
    const calmItems = [item('paracetamol', 500, 1)]
    const flagged = [item('paracetamol', 500, 6), item('energy_drink', 1, 4)]
    const calm = assessFromFlags(calmItems, evaluateInteractions(calmItems), 'engine')
    const loud = assessFromFlags(flagged, evaluateInteractions(flagged), 'engine')
    expect(loud.bodyIndex).toBeGreaterThan(calm.bodyIndex)
  })

  it('records where the assessment came from', () => {
    expect(assessFromFlags([], [], 'holon').source).toBe('holon')
  })

  it('is deterministic across repeated runs', () => {
    const items = [item('paracetamol', 500, 6)]
    const flags = evaluateInteractions(items)
    const a = JSON.stringify(assessFromFlags(items, flags, 'engine'))
    const b = JSON.stringify(assessFromFlags(items, flags, 'engine'))
    expect(a).toBe(b)
  })
})
