/**
 * Shared JSON transport for the AI services (analysis + substance resolver).
 * Prefers the secure proxy (key server-side), then a direct browser call
 * (dev key), and throws otherwise so callers can fall back. Returns parsed JSON.
 */
import { config, hasChatProxy, hasOpenAI } from '../config.js'

export const aiAvailable = hasChatProxy || hasOpenAI

export async function requestJson(kind, payload, buildMessages) {
  if (hasChatProxy) {
    const res = await fetch(`${config.chatProxyUrl.replace(/\/$/, '')}/api/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`proxy /${kind} ${res.status}`)
    const data = await res.json()
    if (!data.result) throw new Error(`proxy /${kind} empty`)
    return data.result
  }

  if (hasOpenAI) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openaiKey}` },
      body: JSON.stringify({
        model: config.openaiModel,
        messages: buildMessages(payload),
        temperature: 0.2,
        response_format: { type: 'json_object' },
        max_tokens: 1100,
      }),
    })
    if (!res.ok) throw new Error(`openai ${res.status}`)
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error('openai empty')
    return JSON.parse(content)
  }

  throw new Error('no-ai')
}
