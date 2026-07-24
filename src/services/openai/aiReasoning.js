/**
 * AI-backed reasoning — generates the "what should I do now" recommendation with
 * the OpenAI API (via the secure proxy or a dev key), grounded in the student's
 * twin. Falls back to the deterministic mock whenever AI is off or errors, so the
 * Next-step page always answers. explainFlag/summarizeTwin stay on the mock
 * (they're faithful field pass-throughs of HOLON/engine data, not generation).
 */
import { twinNaming } from '../../utils/naming.js'
import { SUBSTANCE_BY_ID, SYMPTOMS } from '../mock/mockData.js'
import { buildRecommendMessages } from '../analysis/prompts.js'
import { requestJson, aiAvailable } from '../analysis/aiTransport.js'
import { aiReasoningMock } from '../mock/aiReasoning.mock.js'

const SYMPTOM_LABEL = Object.fromEntries(SYMPTOMS.map((s) => [s.id, s.label]))
const LEVELS = ['all_clear', 'monitor', 'clinic_soon', 'seek_care']
const nameOf = (it) =>
  (SUBSTANCE_BY_ID[it.substanceId]?.label || it.def?.label || it.substanceId).split(' (')[0]

function levelFromOverall(overall) {
  return overall === 'urgent'
    ? 'seek_care'
    : overall === 'caution'
      ? 'clinic_soon'
      : overall === 'watch'
        ? 'monitor'
        : 'all_clear'
}

export const aiReasoning = {
  isAI: aiAvailable,

  explainFlag: (flag) => aiReasoningMock.explainFlag(flag),
  summarizeTwin: (args) => aiReasoningMock.summarizeTwin(args),

  /** "What should I do now" — AI-generated when available, mock otherwise. */
  async recommend({ name, flags = [], overall = 'calm', items = [], symptoms = [] } = {}) {
    if (!aiAvailable) return aiReasoningMock.recommend({ name, flags, overall })

    try {
      const who = twinNaming(name)
      const payload = {
        person: name || 'You',
        isSelf: who.isSelf,
        overall,
        flags: flags.map((f) => ({
          title: f.title,
          severity: f.severity,
          organ: f.organLabel,
          why: f.reason,
          safer: f.saferAlternative,
        })),
        symptoms: (symptoms || []).map((s) => SYMPTOM_LABEL[s] || s),
        substances: (items || []).map(nameOf),
      }

      const r = await requestJson('recommend', payload, buildRecommendMessages)
      const swapFallback = [...new Set(flags.map((f) => f.saferAlternative).filter(Boolean))].slice(0, 3)

      return {
        level: LEVELS.includes(r?.level) ? r.level : levelFromOverall(overall),
        action: String(r?.action || 'Here’s your next step').slice(0, 120),
        subtext: String(r?.subtext || '').slice(0, 400),
        swaps: (Array.isArray(r?.swaps) && r.swaps.length ? r.swaps : swapFallback)
          .slice(0, 4)
          .map((s) => String(s).slice(0, 220)),
        source: 'ai',
      }
    } catch (err) {
      console.warn('[Twinstate] AI recommend failed, using mock:', err.message)
      return aiReasoningMock.recommend({ name, flags, overall })
    }
  },
}
