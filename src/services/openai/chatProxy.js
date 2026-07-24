/**
 * Production chat path — talks to the Twinstate backend proxy (server/proxy.mjs),
 * NOT to OpenAI directly. No secret is ever present in the browser: the proxy
 * holds the key and builds the safety prompt server-side. Enabled by setting
 * VITE_CHAT_PROXY_URL (e.g. http://localhost:8787). Falls back to the grounded
 * offline mock if the proxy is unreachable, so the demo never dead-ends.
 */
import { config } from '../config.js'
import { findRelevant, detectUrgent } from '../../utils/twinContext.js'
import { healthChatMock } from '../mock/healthChat.mock.js'

export const chatProxy = {
  async ask({ question, context, history = [] }) {
    const relevant = findRelevant(question, context)
    const urgentHint = detectUrgent(question, context)

    try {
      const res = await fetch(`${config.chatProxyUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context, history }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(detail.error || `Proxy ${res.status}`)
      }
      const data = await res.json()
      if (!data.answer) throw new Error('Empty proxy response')
      return {
        answer: data.answer,
        grounded: relevant.any,
        groundedOn: relevant.labels,
        urgent: data.urgent ?? urgentHint,
        source: 'openai-proxy',
      }
    } catch (err) {
      console.warn('[Twinstate] chat proxy failed, using offline fallback:', err.message)
      const fallback = await healthChatMock.ask({ question, context })
      return { ...fallback, source: 'mock-fallback' }
    }
  },
}
