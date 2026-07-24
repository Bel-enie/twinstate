/**
 * Offline, grounded health-chat fallback (used when no OpenAI key is set).
 * It still pulls the student's relevant logged data and answers from a small
 * built-in knowledge base, so the demo works with zero configuration. When a
 * key is present, openaiChat replaces this with a full open-domain assistant.
 */
import { findRelevant, detectUrgent } from '../../utils/twinContext.js'

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms))

// Plain-language notes per substance tag, for grounded answers.
const TAG_NOTES = {
  caffeine:
    'Caffeine (from energy drinks, coffee and "stay-awake" pills) is a stimulant. Over ~400 mg a day it can cause a racing heart, jitteriness and poor sleep — and the sleep loss usually hurts more than the caffeine helps.',
  hepatotoxic:
    'This is processed by your liver. Stacking several liver-stressing things (paracetamol, alcohol, herbal tonics) makes the liver work overtime — even at "normal" doses.',
  nsaid:
    'Anti-inflammatory painkillers like ibuprofen and aspirin can irritate the stomach and reduce blood flow to the kidneys, especially on an empty stomach or when you\'re dehydrated. Take them with food and water, one at a time.',
  analgesic:
    'For simple pain, keep to one painkiller at a time, follow the label limit, and treat the cause (rest, fluids) rather than re-dosing.',
  opioid:
    'Opioids (like tramadol or codeine) are sedating. Never combine them with alcohol or other sedatives, and use only what was prescribed to you.',
  ssri:
    'SSRIs are prescribed antidepressants. Some other medicines (like tramadol) can push serotonin too high when combined — always tell a prescriber everything you take.',
  herbal_unknown:
    'Unregulated herbal / "detox" tonics can vary a lot in what\'s actually in them, and several are hard on the liver. "Natural" does not always mean safe.',
}

// Structured dosing answers (Markdown) for "how much / safe / limit" questions.
const DOSING = {
  paracetamol: `**For most healthy adults, the maximum is about 4,000 mg of paracetamol in 24 hours** — but staying under that is safest.

## Typical safe use
- **Per dose:** 500–1,000 mg
- **Spacing:** wait at least **4–6 hours** between doses
- **Per day:** no more than **4,000 mg** (often 8 × 500 mg tablets)

## Take a lower limit if you
- Have low body weight, or liver/kidney problems
- Drink alcohol regularly
- Are eating very little

## Watch out for
- **Hidden paracetamol** in cold & flu sachets — they add up fast with separate tablets.
- Reaching for it every day is a sign to get checked rather than keep dosing.

*This is general information, not a diagnosis. If you think you've taken too much, seek medical care now — even if you feel fine.*`,
  ibuprofen: `**Over-the-counter ibuprofen is usually capped around 1,200 mg a day** (higher only under medical advice).

## Typical safe use
- **Per dose:** 200–400 mg
- **Spacing:** every **6–8 hours**
- Always take **with food** and water

## Be careful if you
- Have stomach, kidney or heart issues
- Are dehydrated or skipping meals
- Are already taking another anti-inflammatory (e.g. aspirin)

*General information, not a diagnosis — check with the health centre if you need it daily.*`,
  caffeine: `**Keep total caffeine under about 400 mg a day.** That's roughly 2 energy drinks or ~4 cups of coffee — and it adds up across drinks and "stay-awake" pills.

## Signs you've had too much
- Racing/pounding heart, jitteriness, anxiety
- Trouble sleeping (which hurts exam performance more than the caffeine helps)

*General information, not a diagnosis.*`,
}

const DOSING_INTENT = /(how much|how many|safe|limit|maximum|max\b|overdose|too much|per day|a day|dose|dosage)/i

function dosingKeyFor(relevant) {
  for (const s of relevant.substances) {
    if (DOSING[s.id]) return s.id
    if (s.tags.includes('caffeine')) return 'caffeine'
    if (s.tags.includes('nsaid')) return 'ibuprofen'
  }
  return null
}

function noteForSubstance(s) {
  for (const tag of ['caffeine', 'nsaid', 'opioid', 'ssri', 'hepatotoxic', 'herbal_unknown', 'analgesic']) {
    if (s.tags.includes(tag)) return TAG_NOTES[tag]
  }
  return `${s.name} is one of the things you've logged. If you're unsure how it fits with the rest, the campus health centre can check.`
}

// Light general-health knowledge for common non-logged questions, so the
// offline helper isn't a single canned line. (The OpenAI backend replaces all
// of this with full open-domain answers when a key is configured.)
const GENERAL = [
  { k: ['sleep', 'insomnia', 'awake', 'tired'], a: 'Sleep is where memory actually consolidates, so it beats an extra all-nighter for exam performance. Aim for a consistent wind-down, no caffeine after early afternoon, and screens down before bed.' },
  { k: ['diet', 'eat', 'food', 'nutrition', 'meal'], a: 'Regular meals with protein, whole grains and some fruit/veg keep energy steadier than sugar-and-caffeine spikes. Skipping meals then dosing painkillers is hard on your stomach.' },
  { k: ['stress', 'anxiety', 'panic', 'overwhelm'], a: 'Short breaks, movement, and slow breathing genuinely lower stress hormones. If anxiety is constant or stopping you functioning, your campus counselling or health service can help — that\'s what they\'re there for.' },
  { k: ['water', 'hydrate', 'dehydr'], a: 'Hydration helps your kidneys and liver do their job and eases headaches. A good rule: sip through the day and check your urine is pale, not dark.' },
  { k: ['exercise', 'workout', 'gym', 'run'], a: 'Even a short walk boosts focus and sleep quality. Just fuel and hydrate around it, especially if you\'re taking anti-inflammatories for soreness.' },
  { k: ['hangover', 'alcohol', 'drink'], a: 'Alcohol dehydrates you and adds liver strain — and mixing it with paracetamol or sedating painkillers is risky. Water and rest help; reaching for more painkillers usually doesn\'t.' },
]

const CARE_LINE =
  'This sounds like it needs proper attention — please contact your campus health centre or a doctor now, and treat it as an emergency (or call local emergency services) if it feels severe.'

function dosingKeyFromQuestion(q) {
  const s = q.toLowerCase()
  if (/(paracetamol|acetaminophen|panadol|tylenol)/.test(s)) return 'paracetamol'
  if (/(ibuprofen|advil|brufen|nurofen|nsaid|anti-?inflammatory)/.test(s)) return 'ibuprofen'
  if (/(caffeine|energy drink|red bull|monster|coffee)/.test(s)) return 'caffeine'
  return null
}

function generalTopic(q) {
  const s = q.toLowerCase()
  const hit = GENERAL.find((g) => g.k.some((w) => s.includes(w)))
  return hit?.a
}

export const healthChatMock = {
  async ask({ question, context }) {
    await delay(650)
    const relevant = findRelevant(question, context)
    const urgent = detectUrgent(question, context)
    const parts = []

    if (urgent) parts.push(CARE_LINE)

    // Dosing / "how much is safe" questions → structured answer with numbers.
    const dosingKey = DOSING_INTENT.test(question)
      ? dosingKeyFor(relevant) || dosingKeyFromQuestion(question)
      : null
    if (dosingKey && DOSING[dosingKey]) {
      const logged = relevant.substances.find(
        (s) =>
          s.id === dosingKey ||
          (dosingKey === 'caffeine' && s.tags.includes('caffeine')) ||
          (dosingKey === 'ibuprofen' && s.tags.includes('nsaid'))
      )
      if (logged) parts.push(`You've logged **${logged.name}**, so this applies to you directly.`)
      parts.push(DOSING[dosingKey])
      return {
        answer: parts.join('\n\n'),
        grounded: relevant.any,
        groundedOn: relevant.labels,
        urgent,
        source: 'mock',
      }
    }

    // Ground in flagged interactions first (most specific).
    if (relevant.flags.length) {
      const f = relevant.flags[0]
      parts.push(
        `Based on your twin, this touches a flag we found — “${f.title}” (${f.severity}). ${f.why} A safer move: ${f.safer}`
      )
    } else if (relevant.substances.length) {
      const names = relevant.substances.map((s) => s.name).join(' and ')
      parts.push(
        `You've logged ${names}. ${noteForSubstance(relevant.substances[0])}`
      )
    } else if (relevant.symptoms.length) {
      const sy = relevant.symptoms.map((s) => s.label.toLowerCase()).join(', ')
      const maybe = context.substances.slice(0, 2).map((s) => s.name).join(' and ')
      parts.push(
        `You mentioned ${sy}. That can have many causes; given what you've logged${maybe ? ` (${maybe})` : ''}, it's worth noticing whether it eases when you cut back or rest. If it's new, severe or not settling, get it checked.`
      )
    } else {
      // General health question, no direct tie to their data.
      const topic = generalTopic(question)
      parts.push(
        topic ||
          "Here's the general picture: rest, hydration and not stacking medicines usually do more good than any single pill during exam season. For anything specific to your body or your prescriptions, a clinician is the safest source."
      )
      parts.push(
        '_Tip: add an OpenAI key (`.env.local`) to unlock full ChatGPT-style answers — this built-in helper covers the essentials offline._'
      )
    }

    if (!urgent) {
      parts.push('Remember: this is general information, not a diagnosis.')
    }

    return {
      answer: parts.join('\n\n'),
      grounded: relevant.any,
      groundedOn: relevant.labels,
      urgent,
      source: 'mock',
    }
  },
}
