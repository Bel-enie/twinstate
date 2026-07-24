/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Twinstate chat proxy — production-safe OpenAI gateway
 * ─────────────────────────────────────────────────────────────────────────
 *  Zero external dependencies (Node 18+ built-ins only): `node server/proxy.mjs`.
 *
 *  WHY THIS EXISTS
 *  The browser must NEVER hold the OpenAI key — anything shipped in a Vite
 *  bundle (VITE_*) is public. This tiny server holds the key server-side
 *  (process.env.OPENAI_API_KEY), builds the grounded + safety-hardened prompt
 *  itself (so a client can't strip the safety rules), rate-limits per IP, caps
 *  body size, and returns only the assistant's answer. The frontend points at
 *  it with VITE_CHAT_PROXY_URL and sends NO secrets.
 *
 *  Env:
 *    OPENAI_API_KEY   (required)  server-side secret — never sent to clients
 *    OPENAI_MODEL     (optional)  default gpt-4o-mini
 *    PORT             (optional)  default 8787
 *    ALLOW_ORIGIN     (optional)  CORS origin, default http://localhost:5173
 * ─────────────────────────────────────────────────────────────────────────
 */
import http from 'node:http'
import {
  buildAnalyzeMessages,
  buildProjectMessages,
  buildResolveMessages,
  buildRecommendMessages,
} from '../src/services/analysis/prompts.js'

const PORT = Number(process.env.PORT || 8787)
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const API_KEY = process.env.OPENAI_API_KEY || ''
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || 'http://localhost:5173'
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

const MAX_BODY = 64 * 1024 // 64 KB request cap
const RATE = { windowMs: 60_000, max: 25 } // 25 requests / minute / IP
const hits = new Map()

// Urgent-symptom keywords — a server-side safety net independent of the client.
const RED_FLAGS = [
  'chest pain', "can't breathe", 'cannot breathe', 'trouble breathing', 'shortness of breath',
  'fainting', 'passed out', 'unconscious', 'overdose', 'suicid', 'self harm', 'self-harm',
  'seizure', 'severe bleeding', 'blue lips', 'confusion', 'slurred speech',
]

function rateLimited(ip) {
  const now = Date.now()
  const rec = hits.get(ip) || { count: 0, reset: now + RATE.windowMs }
  if (now > rec.reset) {
    rec.count = 0
    rec.reset = now + RATE.windowMs
  }
  rec.count += 1
  hits.set(ip, rec)
  return rec.count > RATE.max
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function json(res, status, obj) {
  cors(res)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(obj))
}

function buildMessages({ question, context = {}, history = [] }) {
  const twin = {
    name: context.name,
    overall_risk: context.overall,
    logged_substances: (context.substances || []).map((s) => ({
      name: s.name,
      dose: `${s.dose} ${s.unit}`,
      frequency: s.frequency,
      category: s.category,
    })),
    reported_symptoms: (context.symptoms || []).map((s) => s.label || s),
    flagged_interactions: (context.flags || []).map((f) => ({
      title: f.title,
      severity: f.severity,
      organ: f.organLabel,
      why: f.why,
      safer_alternative: f.safer,
    })),
  }

  const urgent = RED_FLAGS.some((k) => (question || '').toLowerCase().includes(k))

  const system = [
    "You are Twinstate's health assistant for university students — a knowledgeable, friendly explainer of health, medicines, supplements, energy drinks and drug interactions. Answer with the depth and quality of a great ChatGPT reply.",
    '',
    'FORMAT (GitHub-flavored Markdown): open with a 1–2 sentence direct answer; use ## headings + bullets for multi-part answers; bold key numbers/terms; define jargon; be thorough on substantive questions, short on simple ones.',
    '',
    'GROUNDING: the student has a digital twin of what they currently take (below). When the question relates to anything they logged, weave in that specific data and name the items explicitly.',
    '',
    'SAFETY: you are NOT a doctor; this is general information, not a diagnosis; never give exact prescription dose changes — point to a clinician. If anything suggests an emergency (chest pain, trouble breathing, fainting, possible overdose, self-harm, severe/worsening symptoms), LEAD with a clear, calm instruction to seek care now (campus health centre, a doctor, or emergency services). End with a brief italic disclaimer.',
    urgent ? 'THIS MESSAGE IS FLAGGED POTENTIALLY URGENT — start with the care recommendation.' : '',
    '',
    `TWIN DATA:\n${JSON.stringify(twin, null, 2)}`,
  ].join('\n')

  const priorTurns = (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.text.slice(0, 4000) }))

  return {
    urgent,
    messages: [
      { role: 'system', content: system },
      ...priorTurns,
      { role: 'user', content: String(question).slice(0, 4000) },
    ],
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim()

  if (req.method === 'OPTIONS') {
    cors(res)
    res.writeHead(204)
    return res.end()
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    return json(res, 200, { ok: true, model: MODEL, hasKey: Boolean(API_KEY) })
  }

  // ── Strict-JSON AI endpoints: /api/analyze, /api/project, /api/resolve ────
  if (
    req.method === 'POST' &&
    (req.url === '/api/analyze' ||
      req.url === '/api/project' ||
      req.url === '/api/resolve' ||
      req.url === '/api/recommend')
  ) {
    if (!API_KEY) return json(res, 503, { error: 'Server is missing OPENAI_API_KEY.' })
    if (rateLimited(ip)) return json(res, 429, { error: 'Too many requests — slow down a moment.' })

    let payload
    try {
      payload = JSON.parse((await readBody(req)) || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid or oversized request body.' })
    }

    const messages =
      req.url === '/api/analyze'
        ? buildAnalyzeMessages(payload)
        : req.url === '/api/resolve'
          ? buildResolveMessages(payload)
          : req.url === '/api/recommend'
            ? buildRecommendMessages(payload)
            : buildProjectMessages(payload)

    try {
      const upstream = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          max_tokens: 1100,
        }),
      })
      if (!upstream.ok) {
        const detail = await upstream.text().catch(() => '')
        console.warn(`[proxy] OpenAI ${upstream.status}: ${detail.slice(0, 160)}`)
        return json(res, 502, { error: 'Analysis is unavailable right now.' })
      }
      const data = await upstream.json()
      const content = data?.choices?.[0]?.message?.content
      if (!content) return json(res, 502, { error: 'Empty analysis response.' })
      let result
      try {
        result = JSON.parse(content)
      } catch {
        return json(res, 502, { error: 'Malformed analysis response.' })
      }
      return json(res, 200, { result, source: 'openai-proxy' })
    } catch (err) {
      console.warn('[proxy] analyze/project error:', err.message)
      return json(res, 502, { error: 'Analysis is unavailable right now.' })
    }
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    if (!API_KEY) return json(res, 503, { error: 'Server is missing OPENAI_API_KEY.' })
    if (rateLimited(ip)) return json(res, 429, { error: 'Too many requests — slow down a moment.' })

    let payload
    try {
      const raw = await readBody(req)
      payload = JSON.parse(raw || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid or oversized request body.' })
    }

    const question = (payload.question || '').toString().trim()
    if (!question) return json(res, 400, { error: 'A question is required.' })

    const { messages, urgent } = buildMessages(payload)

    try {
      const upstream = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: MODEL, messages, temperature: 0.5, max_tokens: 900 }),
      })
      if (!upstream.ok) {
        const detail = await upstream.text().catch(() => '')
        console.warn(`[proxy] OpenAI ${upstream.status}: ${detail.slice(0, 160)}`)
        return json(res, 502, { error: 'The assistant is unavailable right now. Please try again.' })
      }
      const data = await upstream.json()
      const answer = data?.choices?.[0]?.message?.content?.trim()
      if (!answer) return json(res, 502, { error: 'Empty response from the assistant.' })
      return json(res, 200, { answer, urgent, source: 'openai-proxy' })
    } catch (err) {
      console.warn('[proxy] upstream error:', err.message)
      return json(res, 502, { error: 'The assistant is unavailable right now. Please try again.' })
    }
  }

  json(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  console.log(`[Twinstate] chat proxy on http://localhost:${PORT}  (model: ${MODEL}, key: ${API_KEY ? 'set' : 'MISSING'})`)
})
