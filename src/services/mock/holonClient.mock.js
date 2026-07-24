/**
 * Mock of @ontomorph/holon-client.
 * Provides the drug/substance catalog and interaction lookups that, in
 * production, come from HOLON's clinical knowledge base.
 */
import { SUBSTANCES } from './mockData.js'
import { evaluateInteractions } from './engine.js'

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))

export const holonClientMock = {
  /** Full searchable substance catalog for the intake autocomplete. */
  async getCatalog() {
    await delay(150)
    return SUBSTANCES.map(({ id, label, category, unit, typicalDose, aliases }) => ({
      id,
      label,
      category,
      unit,
      typicalDose,
      aliases,
    }))
  },

  /** Fuzzy search the catalog by name/alias. */
  async search(query) {
    await delay(120)
    const q = query.trim().toLowerCase()
    if (!q) return []
    return SUBSTANCES.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.id.includes(q) ||
        (s.aliases || []).some((a) => a.toLowerCase().includes(q))
    ).slice(0, 8)
  },

  /**
   * Core interaction lookup. Given the student's logged items, return the
   * flagged interactions (grounded in the rule/knowledge base).
   */
  async lookupInteractions(items) {
    await delay(500)
    return evaluateInteractions(items)
  },
}
