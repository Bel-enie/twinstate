import { describe, it, expect } from 'vitest'
import { coverageOf, isChecked, isUnverified, clearanceCopy, labelOf } from '../coverage.js'

const curated = { substanceId: 'paracetamol', def: { label: 'Paracetamol', tags: ['hepatotoxic'] } }
const generic = { substanceId: 'mystery', def: { label: 'Herbal tonic', tags: [], source: 'generic' } }
const aiFound = { substanceId: 'x', def: { label: 'Sertraline', tags: ['serotonergic'], source: 'ai' } }

describe('isChecked', () => {
  it('counts a tagged, curated substance', () => {
    expect(isChecked(curated)).toBe(true)
  })

  it('does NOT count an unresolved substance with no tags', () => {
    expect(isChecked(generic)).toBe(false)
  })

  it('does not count a missing definition', () => {
    expect(isChecked(undefined)).toBe(false)
    expect(isChecked({})).toBe(false)
  })
})

describe('isUnverified', () => {
  it('marks an AI-identified substance', () => {
    expect(isUnverified(aiFound)).toBe(true)
    expect(isUnverified(curated)).toBe(false)
  })
})

/**
 * Regression: items in TwinContext are stored WITHOUT a `def` — just
 * { substanceId, label, unit, dose, frequency }. An early version of the
 * helper only looked at item.def, so every curated substance was reported
 * as "not checked" and the dashboard warned about paracetamol.
 */
describe('stored item shape (no def attached)', () => {
  const stored = { substanceId: 'paracetamol', label: 'Paracetamol', dose: 500, frequency: 'x1/day' }

  it('resolves a curated substance by id and counts it as checked', () => {
    expect(isChecked(stored)).toBe(true)
    expect(coverageOf([stored]).checkedAll).toBe(true)
  })

  it('still reports a genuinely unknown id as unchecked', () => {
    expect(isChecked({ substanceId: 'not-a-real-drug', label: 'Mystery tonic' })).toBe(false)
  })

  it('labels a stored item without a def', () => {
    expect(labelOf(stored)).toMatch(/Paracetamol/)
  })
})

describe('coverageOf', () => {
  it('reports full coverage when everything resolved', () => {
    const c = coverageOf([curated])
    expect(c.checkedAll).toBe(true)
    expect(c.unchecked).toHaveLength(0)
  })

  it('reports the gap when something did not resolve', () => {
    const c = coverageOf([curated, generic])
    expect(c.checkedAll).toBe(false)
    expect(c.checked).toBe(1)
    expect(c.unchecked).toHaveLength(1)
  })

  it('flags AI-identified items separately from unchecked ones', () => {
    const c = coverageOf([aiFound])
    expect(c.checkedAll).toBe(true)
    expect(c.hasUnverified).toBe(true)
  })

  it('handles an empty log', () => {
    expect(coverageOf([]).total).toBe(0)
  })
})

describe('clearanceCopy — never overclaims', () => {
  it('does not say "nothing flagged" alone when something was unchecked', () => {
    const copy = clearanceCopy(coverageOf([curated, generic]))
    expect(copy.tag).toMatch(/could check/i)
    expect(copy.note).toMatch(/Herbal tonic/)
    expect(copy.note).toMatch(/not "safe"/)
  })

  it('still disclaims a full medication review when everything checked', () => {
    const copy = clearanceCopy(coverageOf([curated]))
    expect(copy.note).toMatch(/not a full medication review/i)
  })
})
