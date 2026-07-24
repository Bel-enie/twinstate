/**
 * Resolve a substance the built-in catalog doesn't know (e.g. "Augmentin").
 *
 * Source order (your choice — HOLON-first):
 *   1. HOLON clinical knowledge base  (production source; live only)
 *   2. AI identification              (works today; maps to our tag vocabulary)
 *   3. Generic placeholder            (so the student can still add it)
 *
 * Whatever the source, it returns a substance DEFINITION carried on the item,
 * so the resolved drug flows through the interaction engine + AI analysis
 * exactly like a built-in one (its tags drive organ exposure and rules).
 */
import { hasHolon } from '../config.js'
import { holonLive } from '../live/holonLive.js'
import { buildResolveMessages } from './prompts.js'
import { requestJson, aiAvailable } from './aiTransport.js'

// Keep in sync with prompts.js TAG_VOCAB — protects the engine from junk tags.
const ALLOWED_TAGS = new Set([
  'analgesic', 'nsaid', 'hepatotoxic', 'gastro_irritant', 'nephro_stress', 'blood_thinner',
  'caffeine', 'stimulant', 'stimulant_rx', 'sugar', 'opioid', 'cns_depressant', 'serotonergic',
  'ssri', 'dehydrating', 'herbal_unknown', 'vitamin', 'antibiotic', 'antihistamine', 'hormonal',
])
const ALLOWED_CATEGORIES = new Set(['prescription', 'otc', 'energy_drink', 'supplement', 'herbal'])
const ALLOWED_UNITS = new Set(['mg', 'tablet', 'cup', 'can', 'ml', 'dose', 'drink', 'pill'])

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function makeDef({ id, label, category, tags, unit, typicalDose, caffeinePerUnit, name, source, holonConceptId }) {
  const cleanTags = (Array.isArray(tags) ? tags : []).filter((t) => ALLOWED_TAGS.has(t))
  return {
    id: id || `custom-${slug(name)}`,
    label: label || name,
    category: ALLOWED_CATEGORIES.has(category) ? category : 'otc',
    tags: cleanTags,
    unit: ALLOWED_UNITS.has(unit) ? unit : 'dose',
    typicalDose: Number(typicalDose) > 0 ? Number(typicalDose) : 1,
    ...(Number(caffeinePerUnit) > 0 ? { caffeinePerUnit: Number(caffeinePerUnit) } : {}),
    ...(holonConceptId ? { holonConceptId } : {}), // reused by HOLON interaction screen
    aliases: [name],
    custom: true,
    resolvedBy: source,
  }
}

// Ask the AI for the interaction tags/category of a known-named substance.
async function aiTagsFor(name) {
  if (!aiAvailable) return null
  try {
    const r = await requestJson('resolve', { name }, buildResolveMessages)
    return r && r.recognised !== false ? r : null
  } catch {
    return null
  }
}

export const substanceResolver = {
  hasAI: aiAvailable,

  /**
   * @param {string} name  free-typed substance name
   * @returns {Promise<{ def, source: 'holon'|'ai'|'generic', recognised: boolean, note: string }>}
   */
  async resolve(name) {
    const clean = String(name || '').trim()
    if (!clean) return null

    // 1. HOLON — the production clinical source. Gets the authoritative concept
    //    (id + canonical name); AI supplies the interaction tags that colour the
    //    organs. The conceptId is carried so the interaction screen reuses it.
    if (hasHolon) {
      try {
        const hit = await holonLive.resolveByName(clean)
        if (hit) {
          const ai = await aiTagsFor(hit.label || clean)
          return {
            def: makeDef({
              id: `holon-${hit.conceptId}`,
              label: hit.label || clean,
              category: ai?.category,
              tags: ai?.tags,
              unit: ai?.unit,
              typicalDose: ai?.typicalDose,
              caffeinePerUnit: ai?.caffeinePerUnitMg,
              name: clean,
              source: 'holon',
              holonConceptId: hit.conceptId,
            }),
            source: 'holon',
            recognised: true,
            note: `HOLON concept #${hit.conceptId}${hit.vocab ? ` · ${hit.vocab}` : ''}`,
          }
        }
      } catch {
        /* HOLON unavailable — fall through to AI */
      }
    }

    // 2. AI identification — works today, maps onto our interaction tags.
    if (aiAvailable) {
      try {
        const r = await requestJson('resolve', { name: clean }, buildResolveMessages)
        if (r && r.recognised !== false && (r.canonicalName || r.category)) {
          return {
            def: makeDef({
              label: r.canonicalName,
              category: r.category,
              tags: r.tags,
              unit: r.unit,
              typicalDose: r.typicalDose,
              caffeinePerUnit: r.caffeinePerUnitMg,
              name: clean,
              source: 'ai',
            }),
            source: 'ai',
            recognised: true,
            note: r.note || '',
          }
        }
      } catch {
        /* AI unavailable — fall through */
      }
    }

    // 3. Generic — no interaction data, but the student can still track it.
    return {
      def: makeDef({ name: clean, category: 'otc', tags: [], source: 'generic' }),
      source: 'generic',
      recognised: false,
      note: 'Added manually — limited interaction data available.',
    }
  },
}
