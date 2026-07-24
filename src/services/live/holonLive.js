/**
 * Live HOLON clinical-knowledge client — the REAL @ontomorph/holon-client.
 *
 * This is the production drug-safety source: it resolves each substance the
 * student takes to a HOLON concept, then screens the whole list against HOLON's
 * interaction knowledge base (`interactions.checkList`) and maps the results
 * onto our organ-centric flag shape. Activated by a `holon_…` key in config
 * (VITE_HOLON_API_KEY) — no patient grant needed.
 *
 * Falls back gracefully: any HOLON error is thrown to the caller, which already
 * degrades to the AI/mock engine, so the demo never dead-ends.
 */
import { createHolonClient } from '@ontomorph/holon-client'
import { config } from '../config.js'
import { ORGANS, SUBSTANCE_BY_ID } from '../mock/mockData.js'

let _client = null
function client() {
  if (!_client) {
    _client = createHolonClient({ apiUrl: config.holonApiUrl, apiKey: config.holonKey, timeout: 20_000 })
  }
  return _client
}

// HOLON severity string → our warm 4-step scale.
function mapSeverity(s) {
  const v = String(s || '').toLowerCase()
  if (/(contraindicat|major|severe|high)/.test(v)) return 'urgent'
  if (/(moderate|medium)/.test(v)) return 'caution'
  if (/(minor|low|mild)/.test(v)) return 'watch'
  return 'watch'
}

// Infer which of our 5 organs an interaction hits, from its clinical text.
function mapOrgan(entry) {
  const t = `${entry.mechanism || ''} ${entry.clinicalEffect || ''} ${entry.management || ''}`.toLowerCase()
  if (/(hepat|liver)/.test(t)) return 'liver'
  if (/(renal|kidney|nephro)/.test(t)) return 'kidneys'
  if (/(cardi|qt|arrhythm|tachycard|blood pressure|hypertens|vascular|bleed)/.test(t)) return 'heart'
  if (/(gastro|gi bleed|ulcer|gastrointestinal|stomach|nausea)/.test(t)) return 'stomach'
  if (/(cns|serotonin|sedat|respiratory depress|drowsi|seizure|neuro|central nervous)/.test(t)) return 'brain'
  return 'brain'
}

const strip = (label = '') => label.split(' (')[0].trim()

/** Best-effort display name + search term for a logged item. */
function nameOf(item) {
  return strip(item.def?.label || SUBSTANCE_BY_ID[item.substanceId]?.label || item.substanceId)
}

export const holonLive = {
  /** Resolve a free-typed name to a HOLON drug concept, or null. */
  async resolveByName(name) {
    const q = String(name || '').trim()
    if (!q) return null
    const res = await client().concepts.search(q, { domain: 'Drug', pageSize: 5 })
    const hit = res?.hits?.[0]
    return hit ? { conceptId: hit.conceptId, label: hit.conceptName, code: hit.conceptCode, vocab: hit.vocabularyId } : null
  },

  /** Catalog-style search (used by the resolver) — returns HOLON hits. */
  async search(query) {
    const q = String(query || '').trim()
    if (!q) return []
    const res = await client().concepts.search(q, { domain: 'Drug', pageSize: 8 })
    return (res?.hits || []).map((h) => ({
      id: `holon-${h.conceptId}`,
      label: h.conceptName,
      holonConceptId: h.conceptId,
      category: 'prescription',
      tags: [],
    }))
  },

  /**
   * Screen the whole logged list against HOLON's interaction knowledge base and
   * return flags in our engine's shape (organ-mapped, severity-normalised).
   */
  async lookupInteractions(items = []) {
    if (!items.length) return []
    const c = client()

    // 1. Resolve every item to a HOLON conceptId (reuse one carried on the def).
    const resolved = []
    for (const it of items) {
      const cid = it.def?.holonConceptId
      if (cid) {
        resolved.push({ conceptId: cid, label: nameOf(it) })
        continue
      }
      try {
        const hit = await c.concepts.search(nameOf(it), { domain: 'Drug', pageSize: 1 })
        const h = hit?.hits?.[0]
        if (h) resolved.push({ conceptId: h.conceptId, label: h.conceptName })
      } catch {
        /* skip substances HOLON can't resolve */
      }
    }
    if (resolved.length < 2) return []

    // 2. Whole-list interaction screen.
    const ids = [...new Set(resolved.map((r) => r.conceptId))]
    const nameById = Object.fromEntries(resolved.map((r) => [r.conceptId, r.label]))
    const result = await c.interactions.checkList(ids)

    // 3. Map each interaction to our flag shape (dedup by HOLON entry id).
    const seen = new Set()
    const flags = []
    for (const pair of result?.pairs || []) {
      for (const e of pair.interactions || []) {
        if (seen.has(e.id)) continue
        seen.add(e.id)
        const organ = mapOrgan(e)
        const aName = e.drugAName || nameById[e.drugAConceptId] || 'Drug A'
        const bName = e.drugBName || nameById[e.drugBConceptId] || 'Drug B'
        flags.push({
          id: `holon-${e.id}`,
          title: `${strip(aName)} + ${strip(bName)}`,
          organ,
          organLabel: ORGANS[organ]?.label ?? organ,
          severity: mapSeverity(e.severity),
          substances: [
            { id: String(e.drugAConceptId), label: aName },
            { id: String(e.drugBConceptId), label: bName },
          ],
          reason: [e.clinicalEffect, e.mechanism ? `Mechanism: ${e.mechanism}.` : '']
            .filter(Boolean)
            .join(' '),
          saferAlternative: e.management || 'Discuss this combination with a pharmacist or your prescriber.',
          reference: `HOLON · ${e.source || 'clinical KB'}${e.evidenceGrade ? ` · evidence ${e.evidenceGrade}` : ''}`,
          sources: [
            {
              org: 'HOLON',
              title: `${e.source || 'Clinical knowledge base'}${e.evidenceGrade ? ` — evidence grade ${e.evidenceGrade}` : ''}`,
              url: 'https://developer.ontomorph.com/docs',
            },
          ],
        })
      }
    }
    // Worst first.
    const rank = { calm: 0, watch: 1, caution: 2, urgent: 3 }
    flags.sort((a, b) => rank[b.severity] - rank[a.severity])
    return flags
  },

  /** Parity with the catalog client (HOLON has no fixed catalog to enumerate). */
  async getCatalog() {
    return []
  },
}
