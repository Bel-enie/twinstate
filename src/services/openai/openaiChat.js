/**
 * OpenAI-backed health chat.
 * Grounds every answer in the student's twin data, keeps a hard safety rule to
 * steer urgent/severe cases toward real care, and falls back to the offline
 * grounded mock if the API call fails — so the chat never dead-ends in a demo.
 *
 * SECURITY: this calls OpenAI directly from the browser using VITE_OPENAI_API_KEY.
 * That's fine for a hackathon build, but in production proxy it through a small
 * backend so the key is never shipped to clients.
 */
import { config } from '../config.js'
import { findRelevant, detectUrgent } from '../../utils/twinContext.js'
import { healthChatMock } from '../mock/healthChat.mock.js'

const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

function systemPrompt(ctx, relevant, urgent) {
  const twin = {
    name: ctx.name,
    overall_risk: ctx.overall,
    logged_substances: ctx.substances.map((s) => ({
      name: s.name,
      dose: `${s.dose} ${s.unit}`,
      frequency: s.frequency,
      category: s.category,
    })),
    reported_symptoms: ctx.symptoms.map((s) => s.label),
    flagged_interactions: ctx.flags.map((f) => ({
      title: f.title,
      severity: f.severity,
      organ: f.organLabel,
      why: f.why,
      safer_alternative: f.safer,
    })),
  }

  const relevantBlock = relevant.any
    ? `The question specifically relates to these logged items — reference them explicitly: ${relevant.labels.join(', ')}.`
    : 'The question does not clearly map to their logged data; answer as a general health assistant, and gently note it isn\'t specific to their twin.'

  return [
    "You are Twinstate's health assistant for university students — a knowledgeable, friendly explainer of health, medicines, supplements, energy drinks and drug interactions. Answer with the depth and quality of a great ChatGPT reply.",
    '',
    'FORMAT (use GitHub-flavored Markdown):',
    '- Open with a 1–2 sentence direct answer to the actual question.',
    '- For anything with multiple parts, use short bold section headings (## Heading) and bullet points (e.g. limits, dose spacing, when a lower dose is needed, warnings, when to seek help).',
    '- Bold key numbers and terms. Keep language plain and define any jargon.',
    '- Be genuinely thorough and useful for substantive questions; keep simple ones short. Do not pad.',
    '',
    'GROUNDING:',
    '- The student has a "digital twin" of what they currently take (below). When the question relates to anything they logged, weave in that specific data and name the items explicitly (e.g. "you\'ve logged paracetamol twice a day").',
    '',
    'SAFETY:',
    '- You are NOT a doctor; this is general information, not a diagnosis, and you must not tailor exact prescription dose changes — point to a clinician for those.',
    `- If the question or their data suggests anything urgent or severe (chest pain, trouble breathing, fainting, possible overdose, severe/worsening symptoms, self-harm), lead with a clear, calm instruction to seek care now — the campus health centre, a doctor, or emergency services.${urgent ? ' THIS MESSAGE IS FLAGGED POTENTIALLY URGENT — start with the care recommendation.' : ''}`,
    '- A brief italic disclaimer at the end is good practice.',
    '',
    `TWIN DATA:\n${JSON.stringify(twin, null, 2)}`,
    '',
    relevantBlock,
  ].join('\n')
}

export const openaiChat = {
  async ask({ question, context, history = [] }) {
    const relevant = findRelevant(question, context)
    const urgent = detectUrgent(question, context)

    const messages = [
      { role: 'system', content: systemPrompt(context, relevant, urgent) },
      ...history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.text })),
      { role: 'user', content: question },
    ]

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiKey}`,
        },
        body: JSON.stringify({
          model: config.openaiModel,
          messages,
          temperature: 0.5,
          max_tokens: 900,
        }),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 140)}`)
      }

      const data = await res.json()
      const answer = data?.choices?.[0]?.message?.content?.trim()
      if (!answer) throw new Error('Empty response from OpenAI')

      return {
        answer,
        grounded: relevant.any,
        groundedOn: relevant.labels,
        urgent,
        source: 'openai',
      }
    } catch (err) {
      // Never dead-end: fall back to the grounded offline answer.
      console.warn('[Twinstate] OpenAI chat failed, using offline fallback:', err.message)
      const fallback = await healthChatMock.ask({ question, context })
      return { ...fallback, source: 'mock-fallback' }
    }
  },
}
