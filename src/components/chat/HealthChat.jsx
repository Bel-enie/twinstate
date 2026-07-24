import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../ui/Card.jsx'
import Markdown from '../ui/Markdown.jsx'
import { useTwin } from '../../context/TwinContext.jsx'
import { chat } from '../../services/index.js'
import { buildTwinContext, suggestedQuestions } from '../../utils/twinContext.js'

const GREETING = {
  role: 'assistant',
  text:
    "Hi — I'm your health helper. Ask me anything about what you've logged (your meds, energy drinks, symptoms) or general health. I'll ground answers in your twin where I can. I'm not a doctor, so for anything serious I'll point you to real care.",
  meta: {},
}

export default function HealthChat() {
  const { twin, items, symptoms, flags, overall } = useTwin()
  const ctx = useMemo(
    () => buildTwinContext({ twin, items, symptoms, flags, overall }),
    [twin, items, symptoms, flags, overall]
  )
  const suggestions = useMemo(() => suggestedQuestions(ctx), [ctx])

  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, busy])

  const send = async (text) => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setInput('')
    const nextHistory = [...messages, { role: 'user', text: q }]
    setMessages(nextHistory)
    setBusy(true)
    try {
      const res = await chat.ask({ question: q, context: ctx, history: nextHistory })
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: res.answer,
          meta: { grounded: res.grounded, groundedOn: res.groundedOn, urgent: res.urgent, source: res.source },
        },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: "Sorry — I couldn't answer just now. If this is urgent, please contact your campus health centre or a doctor.",
          meta: { urgent: false },
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* header */}
      <div className="panel-head flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="panel-eyebrow">Grounded assistant</p>
          <h2 className="mt-1.5 text-[17px] font-bold leading-tight tracking-tight text-ink">
            Ask about your health
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-soft">
            Answered from your twin · {chat.isAI ? 'AI assistant' : 'offline helper'}
          </p>
        </div>
        <Link to="/faq" className="shrink-0 text-xs font-semibold text-brand-600 hover:underline">
          FAQ →
        </Link>
      </div>

      {/* messages */}
      <div className="flex max-h-[380px] flex-col gap-3 overflow-y-auto px-5 py-4">
        {messages.map((m, i) => (
          <Message key={i} m={m} />
        ))}
        {busy && (
          <div className="flex items-center gap-1.5 self-start rounded-[10px] bg-shell px-4 py-3">
            <Dot /> <Dot d="150" /> <Dot d="300" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* suggestions */}
      {messages.length <= 1 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={busy}
              className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-slate-soft hover:bg-brand-50 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="flex items-center gap-2 border-t border-ink/5 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a med, symptom, or anything health…"
          aria-label="Ask a health question"
          className="input-glass flex-1 rounded-[10px] px-4 py-3 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="btn-solid grid h-11 w-11 shrink-0 place-items-center rounded-[10px] transition"
          aria-label="Send"
        >
          ↑
        </button>
      </form>
    </Card>
  )
}

function Message({ m }) {
  if (m.role === 'user') {
    return (
      <div className="max-w-[85%] self-end rounded-[10px] rounded-br-[3px] bg-brand-600 px-4 py-2.5 text-sm text-white">
        {m.text}
      </div>
    )
  }
  const urgent = m.meta?.urgent
  return (
    <div className="max-w-[92%] self-start">
      {urgent && (
        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">
          ⚠️ Please seek care
        </div>
      )}
      <div
        className={`rounded-[10px] rounded-bl-[3px] px-4 py-3 text-sm ${
          urgent ? 'bg-rose-50 text-rose-900' : 'bg-shell text-ink/90'
        }`}
      >
        <Markdown text={m.text} />
      </div>
      {m.meta?.groundedOn?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-soft">
            Grounded in
          </span>
          {m.meta.groundedOn.slice(0, 4).map((g) => (
            <span key={g} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
              {g}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Dot({ d = '0' }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-soft"
      style={{ animationDelay: `${d}ms` }}
    />
  )
}
