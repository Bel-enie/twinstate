import { describe, it, expect } from 'vitest'
import {
  SEVERITY_BASE,
  SEVERITY_WEIGHT,
  frequencyToTimes,
  normalizeItems,
  buildContext,
  evaluateInteractions,
  computeOrganRisk,
  computeOverall,
  computeBodyIndex,
  deriveTwinState,
} from '../engine.js'

/**
 * These lock the CLINICAL THRESHOLDS, not the implementation. Each case is a
 * dose pattern a student could actually log, asserted against the published
 * line the rule cites (paracetamol ~3000 mg/day, caffeine ~400 mg/day).
 *
 * The point is that every number the UI shows is reproducible from the rules
 * alone, with no model involved.
 */

const item = (substanceId, dose, frequency = 1) => ({ substanceId, dose, frequency })

describe('frequencyToTimes', () => {
  it('reads a plain daily count', () => {
    expect(frequencyToTimes(3)).toBe(3)
  })

  it('falls back to once a day for unknown input', () => {
    expect(frequencyToTimes(undefined)).toBe(1)
    expect(frequencyToTimes(null)).toBe(1)
  })
})

describe('normalizeItems', () => {
  it('attaches the substance definition', () => {
    const [it] = normalizeItems([item('paracetamol', 500, 2)])
    expect(it.def.label).toMatch(/Paracetamol/)
    expect(it.times).toBe(2)
  })

  it('drops items with no known substance rather than throwing', () => {
    expect(normalizeItems([{ substanceId: 'not-a-real-drug', dose: 1 }])).toHaveLength(0)
  })

  it('survives an empty or missing list', () => {
    expect(normalizeItems()).toEqual([])
    expect(normalizeItems([])).toEqual([])
  })
})

describe('buildContext totals', () => {
  it('sums daily mg across repeated doses', () => {
    const ctx = buildContext([item('paracetamol', 500, 4)])
    expect(ctx.dailyMg('paracetamol')).toBe(2000)
  })

  it('sums caffeine across different sources', () => {
    // 2 energy drinks (120 each) + 2 coffees (95 each) = 430 mg
    const ctx = buildContext([item('energy_drink', 1, 2), item('coffee', 1, 2)])
    expect(ctx.totalCaffeine()).toBe(430)
  })
})

describe('paracetamol threshold (rule cites ~3000 mg/day)', () => {
  it('does NOT flag just below the line', () => {
    const flags = evaluateInteractions([item('paracetamol', 500, 5)]) // 2500 mg
    expect(flags.some((f) => f.id === 'paracetamol-overuse')).toBe(false)
  })

  it('flags exactly at the line', () => {
    const flags = evaluateInteractions([item('paracetamol', 500, 6)]) // 3000 mg
    expect(flags.some((f) => f.id === 'paracetamol-overuse')).toBe(true)
  })

  it('attaches real citations to the flag it fires', () => {
    const flag = evaluateInteractions([item('paracetamol', 1000, 3)]).find(
      (f) => f.id === 'paracetamol-overuse'
    )
    expect(flag.sources.length).toBeGreaterThan(0)
    for (const s of flag.sources) expect(s.url).toMatch(/^https:\/\//)
  })
})

describe('caffeine threshold (rule cites ~400 mg/day)', () => {
  it('does NOT flag below the line', () => {
    const flags = evaluateInteractions([item('energy_drink', 1, 3)]) // 360 mg
    expect(flags.some((f) => f.id === 'caffeine-stimulant-heart')).toBe(false)
  })

  it('flags once combined sources cross it', () => {
    // 3 energy drinks (360) + 1 coffee (95) = 455 mg
    const flags = evaluateInteractions([item('energy_drink', 1, 3), item('coffee', 1, 1)])
    expect(flags.some((f) => f.id === 'caffeine-stimulant-heart')).toBe(true)
  })
})

describe('multi-source liver rule', () => {
  it('needs two distinct hepatotoxic sources, not one', () => {
    const one = evaluateInteractions([item('paracetamol', 500, 1)])
    expect(one.some((f) => f.id === 'double-hepatotoxic')).toBe(false)
  })
})

describe('severity aggregation', () => {
  it('escalates overall to the worst flag present', () => {
    expect(computeOverall([{ severity: 'watch' }, { severity: 'caution' }])).toBe('caution')
  })

  it('is calm with no flags', () => {
    expect(computeOverall([])).toBe('calm')
  })

  it('orders severity weights low to high', () => {
    expect(SEVERITY_WEIGHT.calm).toBeLessThan(SEVERITY_WEIGHT.watch)
    expect(SEVERITY_WEIGHT.watch).toBeLessThan(SEVERITY_WEIGHT.caution)
    expect(SEVERITY_WEIGHT.caution).toBeLessThan(SEVERITY_WEIGHT.urgent)
  })

  it('maps each flag onto its organ', () => {
    const risk = computeOrganRisk(evaluateInteractions([item('paracetamol', 500, 6)]))
    expect(risk.liver.severity).toBe('caution')
    expect(risk.liver.flagCount).toBeGreaterThan(0)
  })
})

describe('body index', () => {
  it('stays inside 0-100 for an empty log and a heavy one', () => {
    const empty = computeBodyIndex([])
    const heavy = computeBodyIndex([
      item('paracetamol', 1000, 4),
      item('energy_drink', 1, 5),
      item('ibuprofen', 400, 3),
    ])
    for (const v of [empty, heavy]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })

  it('rises when the same body logs more', () => {
    const light = computeBodyIndex([item('paracetamol', 500, 1)])
    const heavy = computeBodyIndex([
      item('paracetamol', 1000, 4),
      item('energy_drink', 1, 5),
    ])
    expect(heavy).toBeGreaterThan(light)
  })

  it('is deterministic — the same input gives the same number every time', () => {
    const items = [item('paracetamol', 500, 6), item('energy_drink', 1, 4)]
    const runs = new Set(Array.from({ length: 25 }, () => computeBodyIndex(items)))
    expect(runs.size).toBe(1)
  })
})

describe('deriveTwinState', () => {
  it('returns a complete state for an empty log without throwing', () => {
    const s = deriveTwinState([])
    expect(s.overall).toBe('calm')
    expect(s.flags).toEqual([])
    expect(Object.keys(s.organRisk).length).toBeGreaterThan(0)
  })

  it('reports a known severity and a flag count for every organ', () => {
    const s = deriveTwinState([item('paracetamol', 500, 6), item('energy_drink', 1, 4)])
    for (const [, r] of Object.entries(s.organRisk)) {
      expect(SEVERITY_BASE[r.severity]).toBeDefined()
      expect(r.flagCount).toBeGreaterThanOrEqual(0)
    }
  })

  it('is stable across repeated evaluation (no hidden randomness)', () => {
    const items = [item('paracetamol', 500, 6), item('coffee', 1, 3)]
    expect(JSON.stringify(deriveTwinState(items))).toBe(JSON.stringify(deriveTwinState(items)))
  })
})
