/**
 * Turns the live twin state into a compact, groundable context for the health
 * chat: a structured summary, a relevance matcher (so we can pull the SPECIFIC
 * logged items a question is about), an urgent red-flag detector, and starter
 * questions. Shared by both the OpenAI and the offline-mock chat implementations
 * so the grounding is identical regardless of backend.
 */
import { SUBSTANCE_BY_ID, SYMPTOMS } from '../services/mock/mockData.js'
import { twinNaming } from './naming.js'

const SYMPTOM_BY_ID = Object.fromEntries(SYMPTOMS.map((s) => [s.id, s]))

// Organ keyword synonyms → which organ they point at.
const ORGAN_TERMS = {
  liver: ['liver', 'hepatic', 'jaundice'],
  heart: ['heart', 'palpitation', 'racing', 'chest', 'cardiac', 'blood pressure', 'pulse'],
  kidneys: ['kidney', 'renal', 'urine', 'urinate', 'pee'],
  brain: ['brain', 'head', 'sleep', 'insomnia', 'anxiety', 'mood', 'serotonin', 'nervous', 'dizzy'],
  stomach: ['stomach', 'gut', 'nausea', 'ulcer', 'digest', 'tummy', 'vomit', 'acid'],
}

/** Reshape twin state into a compact structured context. */
export function buildTwinContext({ twin, items = [], symptoms = [], flags = [], overall = 'calm' }) {
  const substances = items
    .map((it) => {
      const def = SUBSTANCE_BY_ID[it.substanceId]
      if (!def) return null
      return {
        id: it.substanceId,
        name: def.label.split(' (')[0],
        fullName: def.label,
        dose: it.dose,
        unit: def.unit,
        frequency: it.frequency,
        category: def.category,
        tags: def.tags,
        aliases: def.aliases || [],
      }
    })
    .filter(Boolean)

  const symptomList = symptoms.map((id) => ({ id, label: SYMPTOM_BY_ID[id]?.label || id }))

  const flagList = flags.map((f) => ({
    id: f.id,
    title: f.title,
    severity: f.severity,
    organ: f.organ,
    organLabel: f.organLabel,
    why: f.reason,
    safer: f.saferAlternative,
    substances: (f.substances || []).map((s) => s.label.split(' (')[0]),
  }))

  return {
    name: twin?.name || 'You',
    naming: twinNaming(twin?.name),
    overall,
    substances,
    symptoms: symptomList,
    flags: flagList,
  }
}

/** Find the specific logged data a question is about. */
export function findRelevant(question, ctx) {
  const q = ` ${String(question || '').toLowerCase()} `
  const has = (term) => q.includes(term.toLowerCase())

  const substances = ctx.substances.filter((s) => {
    const terms = [s.name, s.id.replace(/_/g, ' '), ...s.aliases, ...s.tags]
    return terms.some((t) => t && has(t))
  })

  const symptoms = ctx.symptoms.filter((s) => {
    const words = [s.id, ...s.label.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3)]
    return words.some((w) => has(w))
  })

  // Organs mentioned → include their flags.
  const organs = Object.keys(ORGAN_TERMS).filter((organ) =>
    ORGAN_TERMS[organ].some((t) => has(t))
  )
  const flags = ctx.flags.filter(
    (f) =>
      organs.includes(f.organ) ||
      substances.some((s) => f.substances.some((fs) => fs.toLowerCase() === s.name.toLowerCase()))
  )

  const labels = [
    ...new Set([
      ...substances.map((s) => s.name),
      ...symptoms.map((s) => s.label),
      ...flags.map((f) => f.title),
    ]),
  ]

  return { substances, symptoms, flags, organs, labels, any: labels.length > 0 }
}

// Red-flag phrases that should always steer toward real care.
const RED_FLAGS = [
  'chest pain', 'chest tightness', "can't breathe", 'cant breathe', 'cannot breathe',
  'trouble breathing', 'difficulty breathing', 'shortness of breath', 'breathless',
  'faint', 'fainting', 'passed out', 'pass out', 'unconscious', 'collapse',
  'seizure', 'convulsion', 'overdose', 'took too many', 'too many pills',
  'suicid', 'kill myself', 'end my life', 'self harm', 'self-harm', 'harm myself',
  'worst headache', 'vomiting blood', 'blood in', 'coughing blood', 'bleeding a lot',
  'numb', 'slurred', 'paralysis', "can't move", 'allergic reaction', 'throat closing',
  'anaphyla', 'swelling of', 'irregular heartbeat', 'very fast heartbeat', 'not breathing',
]

/** True when the question or the twin's own state warrants urgent care advice. */
export function detectUrgent(question, ctx) {
  const q = String(question || '').toLowerCase()
  if (RED_FLAGS.some((t) => q.includes(t))) return true
  if (ctx?.overall === 'urgent') return true
  return false
}

/** Starter questions tailored to what the student logged. */
export function suggestedQuestions(ctx) {
  const out = []
  if (ctx.flags[0]) out.push(`Why is my ${ctx.flags[0].organLabel.toLowerCase()} flagged?`)
  const caffeine = ctx.substances.find((s) => s.tags.includes('caffeine'))
  if (caffeine) out.push('Is my caffeine intake too high?')
  const painkillers = ctx.substances.filter((s) => s.tags.includes('analgesic'))
  if (painkillers.length >= 2) out.push('Can I take these painkillers together?')
  else if (painkillers[0]) out.push(`How much ${painkillers[0].name} is safe in a day?`)
  if (ctx.symptoms.find((s) => s.id === 'insomnia')) out.push('How can I sleep better during exams?')
  out.push('What are the warning signs I should see a doctor?')
  return [...new Set(out)].slice(0, 4)
}
