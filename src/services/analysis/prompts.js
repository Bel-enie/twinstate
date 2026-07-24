/**
 * Isomorphic prompt builders for AI-calculated twin stats.
 *
 * Imported by BOTH the browser (src/services/analysis/aiAnalysis.js) and the
 * Node proxy (server/proxy.mjs), so the exact same grounded, JSON-strict prompt
 * drives analysis whether the key sits in the browser (dev) or on the server
 * (prod). Depends only on the pure data catalog — no browser or Node globals.
 */
import { ORGANS } from '../mock/mockData.js'

const ORGAN_KEYS = Object.keys(ORGANS)
const ORGAN_LIST = ORGAN_KEYS.map((k) => `"${k}" (${ORGANS[k].label})`).join(', ')

// Severity → intensity bands the model must stay inside, so AI scores map onto
// the same colours/thresholds the deterministic engine uses.
const BANDS =
  'calm = 6–33, watch = 34–57, caution = 58–77, urgent = 78–100'

const SAFETY =
  'You are not a doctor and this is not a diagnosis. Base every score ONLY on the data given — never invent substances or symptoms. Be calibrated: a single low dose is usually calm/watch; genuine stacking or known dangerous combinations earn caution/urgent.'

/** Build the chat messages that ask the model to SCORE a twin. */
export function buildAnalyzeMessages(payload = {}) {
  const { name, items = [], symptoms = [], profile = {} } = payload

  const data = {
    person: name || 'the student',
    profile,
    logged_substances: items,
    reported_symptoms: symptoms,
  }

  const system = [
    'You are Twinstate\'s clinical-analysis engine. You read what a university student currently takes (medicines, OTC painkillers, energy drinks, supplements, herbal products) plus their symptoms, and you CALCULATE a grounded risk assessment of their body.',
    SAFETY,
    '',
    `ORGANS to score (use these exact keys): ${ORGAN_LIST}.`,
    `Severity vocabulary: "calm", "watch", "caution", "urgent". Intensity is 0–100 and MUST fall in its severity band: ${BANDS}.`,
    '',
    'How to reason per organ: caffeine loads heart & brain (racing heart, poor sleep); paracetamol, alcohol and unregulated herbal tonics load the liver; NSAIDs (ibuprofen, aspirin) load the stomach and kidneys; opioids + sedatives and SSRIs load the brain/nervous system. Weigh dose × times-per-day and dangerous combinations, and let reported symptoms raise the matching organ.',
    'body_index (0–100) = the whole-body stress, roughly the worst organ weighted with the average (worst*0.7 + average*0.3).',
    'flags = the specific risky combinations or overuse patterns you actually find (0 or more). Each names the real logged substances involved and explains the mechanism in plain, warm, non-alarming language a student understands.',
    '',
    'Return ONLY a single JSON object, no prose, no markdown, matching EXACTLY:',
    `{
  "body_index": <int 0-100>,
  "overall": "calm|watch|caution|urgent",
  "headline": "<one warm sentence summarising their body right now>",
  "organs": {
    ${ORGAN_KEYS.map((k) => `"${k}": { "severity": "...", "intensity": <int 0-100>, "note": "<short plain reason>" }`).join(',\n    ')}
  },
  "flags": [
    {
      "title": "<short title>",
      "organ": "<one organ key>",
      "severity": "watch|caution|urgent",
      "substances": ["<real logged substance name>", "..."],
      "reason": "<plain-English why it's risky, referencing their actual amounts>",
      "saferAlternative": "<one concrete safer action>",
      "reference": "<short clinical basis, e.g. 'caffeine cardiovascular threshold ~400 mg/day'>"
    }
  ]
}`,
  ].join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: `TWIN DATA:\n${JSON.stringify(data, null, 2)}` },
  ]
}

// Interaction-relevant tag vocabulary the engine understands. AI-resolved
// substances must map onto THESE so they flow into the rules + organ exposure.
const TAG_VOCAB = [
  'analgesic', 'nsaid', 'hepatotoxic', 'gastro_irritant', 'nephro_stress', 'blood_thinner',
  'caffeine', 'stimulant', 'stimulant_rx', 'sugar', 'opioid', 'cns_depressant', 'serotonergic',
  'ssri', 'dehydrating', 'herbal_unknown', 'vitamin', 'antibiotic', 'antihistamine', 'hormonal',
]
const CATEGORY_VOCAB = ['prescription', 'otc', 'energy_drink', 'supplement', 'herbal']

/** Build the chat messages that ask the model to IDENTIFY an unknown substance. */
export function buildResolveMessages(payload = {}) {
  const name = (payload.name || payload.query || '').toString().slice(0, 120)

  const system = [
    'You identify a medicine, supplement, energy drink or herbal product from its name so a drug-interaction engine can reason about it. Use widely accepted clinical knowledge.',
    SAFETY,
    '',
    `Classify it into ONE category from: ${CATEGORY_VOCAB.join(', ')}.`,
    `Assign every interaction-relevant tag that applies, ONLY from this list: ${TAG_VOCAB.join(', ')}. Example: amoxicillin/clavulanate (Augmentin) → category "prescription", tags ["antibiotic","hepatotoxic"]. Ibuprofen → tags ["nsaid","analgesic","gastro_irritant","nephro_stress"].`,
    'Give a sensible typical single dose + unit (mg, tablet, cup, can, ml, dose). If it contains caffeine, include caffeinePerUnitMg.',
    'If the name is not a recognisable health product, set "recognised": false.',
    '',
    'Return ONLY a JSON object, no prose, matching EXACTLY:',
    `{
  "recognised": true,
  "canonicalName": "<clean display name, may include common brand in parentheses>",
  "category": "${CATEGORY_VOCAB.join('|')}",
  "tags": ["<from the allowed list>"],
  "unit": "mg|tablet|cup|can|ml|dose|drink|pill",
  "typicalDose": <number>,
  "caffeinePerUnitMg": <number, omit if none>,
  "note": "<one short plain sentence on what it is>"
}`,
  ].join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: `SUBSTANCE NAME: ${name}` },
  ]
}

/** Build the chat messages that ask the model for a "what should I do now" plan. */
export function buildRecommendMessages(payload = {}) {
  const { person = 'the student', isSelf = true, overall = 'calm', flags = [], symptoms = [], substances = [] } = payload

  const data = {
    person,
    overall_risk: overall,
    logged_substances: substances,
    reported_symptoms: symptoms,
    flagged_interactions: flags,
  }

  const voice = isSelf
    ? 'Address them directly as "you".'
    : `Refer to them in the third person by their first name ("${String(person).split(',')[0]}").`

  const system = [
    "You are Twinstate's health assistant giving ONE clear next step to a university student, based entirely on their digital twin (below).",
    SAFETY,
    voice,
    '',
    'Choose a triage "level" from EXACTLY these four, matched to the real risk:',
    '- "all_clear": nothing risky logged.',
    '- "monitor": mild/"watch" — small changes at home, keep logging.',
    '- "clinic_soon": "caution" — real strain; make changes now and get a check-in within days.',
    '- "seek_care": "urgent"/high-risk combos (e.g. opioid + sedative, serotonin stack, big overdose risk) — stop now and get seen today, or urgent care if unwell.',
    '',
    'Write warm, plain, non-alarming language grounded in their ACTUAL logged items and flags. "action" is a short imperative headline. "subtext" is 1–2 sentences on why, naming the specific driver. "swaps" are 2–4 concrete, doable changes tied to what they take.',
    '',
    'Return ONLY a JSON object, no prose, matching EXACTLY:',
    `{
  "level": "all_clear|monitor|clinic_soon|seek_care",
  "action": "<short imperative headline>",
  "subtext": "<1-2 warm sentences, references their real data>",
  "swaps": ["<concrete swap>", "<concrete swap>"]
}`,
    '',
    `TWIN DATA:\n${JSON.stringify(data, null, 2)}`,
  ].join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: 'What should I do now?' },
  ]
}

/** Build the chat messages that ask the model to PROJECT two futures. */
export function buildProjectMessages(payload = {}) {
  const { organs = {}, bodyIndex = 0, items = [], weeks = 2 } = payload

  const data = { current_organ_intensity: organs, current_body_index: bodyIndex, logged_substances: items, weeks }

  const system = [
    'You are Twinstate\'s What-If simulation engine. Given a student\'s CURRENT per-organ stress and what they take, you project two futures over the given number of weeks:',
    '  - "continue": they keep the exact same pattern.',
    '  - "safer": they rest, hydrate, cut to one painkiller and reduce caffeine.',
    SAFETY,
    '',
    `Score every organ (keys: ${ORGAN_KEYS.map((k) => `"${k}"`).join(', ')}) as intensity 0–100. On "continue", stressed organs drift UP over the weeks; on "safer" they recover DOWN toward calm. Keep changes realistic (a few points per week), never below 6 or above 100.`,
    'body_index for each path = worst organ weighted with the average (worst*0.7 + average*0.3).',
    '',
    'Return ONLY a single JSON object, no prose, matching EXACTLY:',
    `{
  "continue": {
    "organStress": { ${ORGAN_KEYS.map((k) => `"${k}": <int>`).join(', ')} },
    "bodyIndex": <int>,
    "overall": "calm|watch|caution|urgent",
    "headline": "<short>",
    "detail": "<1-2 sentences, warm, mentions the projected body index>"
  },
  "safer": { "organStress": { ... }, "bodyIndex": <int>, "overall": "...", "headline": "...", "detail": "..." }
}`,
  ].join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: `PROJECTION INPUT:\n${JSON.stringify(data, null, 2)}` },
  ]
}
