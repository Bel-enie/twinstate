/**
 * Plain-language evidence for one flag: where it came from, which guidance
 * backs it, how sure we can be, and the question to take to a pharmacist.
 * Used by the dashboard rows, the flag detail page and the clinician summary
 * so a flag reads the same everywhere.
 */
import { coverageOf } from '../services/analysis/coverage.js'

const short = (label = '') => String(label).split(' (')[0]
// In a sentence, common substance names are lowercase ("take paracetamol with coffee").
const inSentence = (label = '') => short(label).toLowerCase()

/** 'rule' | 'ai' | 'holon' */
export function originOfFlag(flag) {
  if (String(flag?.reference || '').startsWith('HOLON') || flag?.sources?.some((s) => s.org === 'HOLON')) return 'holon'
  if (flag?.source === 'ai') return 'ai'
  return 'rule'
}

export const ORIGIN_LABEL = {
  rule: 'Built-in rule',
  ai: 'AI-reviewed',
  holon: 'HOLON database',
}

export const ORIGIN_HELP = {
  rule: 'Matched by one of Twinstate’s own published rules.',
  ai: 'Raised or reworded by the AI on top of the rules. Check the sources before relying on it.',
  holon: 'From HOLON, Ontomorph’s clinical drug-interaction database.',
}

/** Unique guidance bodies cited by the flag, e.g. ['NHS', 'FDA']. */
export const sourceOrgs = (flag) => [...new Set((flag?.sources || []).map((s) => s.org).filter(Boolean))]

/**
 * How much to trust it, in words. Lower when the flag involves a substance
 * the AI identified, or when the flag cites no guidance at all.
 */
export function confidenceOf(flag, items = []) {
  const ids = new Set((flag?.substances || []).map((s) => s.id))
  const cov = coverageOf(items.filter((it) => ids.has(it.substanceId)))
  if (cov.hasUnverified) return { level: 'low', label: 'Low confidence · AI-identified substance' }
  if (!sourceOrgs(flag).length) return { level: 'medium', label: 'Medium confidence · no guidance linked' }
  if (originOfFlag(flag) === 'ai') return { level: 'medium', label: 'Medium confidence' }
  return { level: 'high', label: 'High confidence' }
}

/** The one question to ask a pharmacist about this flag. */
export function pharmacistQuestion(flag) {
  const names = (flag?.substances || []).map((s) => inSentence(s.label)).filter(Boolean)
  if (names.length >= 2) {
    const list = names.length === 2 ? `${names[0]} with ${names[1]}` : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
    return `Is it safe for me to take ${list} together, and how should I space them?`
  }
  if (names.length === 1) return `How much ${names[0]} is safe for me in a day, given everything else I take?`
  return 'Is anything I take likely to interact, given what I’ve logged?'
}
