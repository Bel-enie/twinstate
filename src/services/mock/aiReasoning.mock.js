/**
 * Mock of Ontomorph's AI reasoning endpoint.
 * Turns HOLON's structured flags into warm, plain-language explanations and
 * an overall "what should I do now" recommendation. In production this is an
 * LLM grounded on the same HOLON reference data (retrieval-augmented), so the
 * output shape here mirrors what the live endpoint returns.
 */
import { SEVERITY_WEIGHT } from './engine.js'
import { twinNaming } from '../../utils/naming.js'

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms))

const SEVERITY_TONE = {
  calm: 'Nothing here is raising a flag right now.',
  watch: "This is worth keeping an eye on — not an emergency.",
  caution: "This one deserves a real change to how you're dosing.",
  urgent: 'This combination is high-risk — please act on it soon.',
}

export const aiReasoningMock = {
  /** Friendly one-liner + detail for a single flag. */
  async explainFlag(flag) {
    await delay(300)
    return {
      headline: flag.title,
      plain: flag.reason,
      tone: SEVERITY_TONE[flag.severity],
      safer: flag.saferAlternative,
      grounding: flag.reference,
    }
  },

  /** A short plain-language summary of the whole twin. */
  async summarizeTwin({ name, flags, overall }) {
    await delay(400)
    const who = twinNaming(name)
    const have = who.isSelf ? 'have' : 'has'
    if (!flags.length) {
      return {
        overall,
        text: `Nothing in what ${who.subject} logged is interacting in a risky way right now. Rest and hydration are doing more than any pill — keep it up.`,
      }
    }
    const top = flags[0]
    const organs = [...new Set(flags.map((f) => f.organLabel))]
    const organPhrase =
      organs.length === 1
        ? organs[0].toLowerCase()
        : `${organs.slice(0, -1).join(', ').toLowerCase()} and ${organs.slice(-1)[0].toLowerCase()}`
    return {
      overall,
      text: `${who.first} ${have} ${flags.length} thing${flags.length > 1 ? 's' : ''} worth attention — mainly around the ${organPhrase}. The biggest one: ${top.title.toLowerCase()}. It's just what ${who.possessive} combination is doing to ${who.possessive} body, so a small change goes a long way.`,
    }
  },

  /**
   * The "what should I do now" recommendation.
   * Returns a triage level + one clear action + safer swaps.
   */
  async recommend({ name, flags, overall }) {
    await delay(400)
    const who = twinNaming(name)
    const swaps = [...new Set(flags.map((f) => f.saferAlternative))].slice(0, 3)

    let level, action, subtext
    if (overall === 'urgent' || SEVERITY_WEIGHT[overall] >= 3) {
      level = 'seek_care'
      action = 'Speak to a clinician soon'
      subtext = `One of ${who.possessive} combinations is high-risk. ${who.first} should stop it now and get seen at the campus clinic today — or urgent care if feeling unwell.`
    } else if (overall === 'caution') {
      level = 'clinic_soon'
      action = 'Book the campus clinic this week'
      subtext = `${who.Possessive} pattern is putting real strain on ${who.possessive} body. Make the swaps below now, and get a quick check-in at the clinic within a few days.`
    } else if (overall === 'watch') {
      level = 'monitor'
      action = 'Keep monitoring & make small swaps'
      subtext = `Nothing urgent. Make the small changes below and keep logging — if symptoms build, ${who.subject} should check in with the clinic.`
    } else {
      level = 'all_clear'
      action = 'In good shape — keep it up'
      subtext = `No risky interactions right now. Protect ${who.possessive} sleep and hydration through exam season.`
    }

    return { level, action, subtext, swaps }
  },
}
