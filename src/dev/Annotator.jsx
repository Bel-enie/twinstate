import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, MessageSquarePlus, PenLine, RotateCcw, Trash2, X } from 'lucide-react'

/**
 * Annotate mode (dev server only — main.jsx never loads this in production).
 *
 * Turn it on with the button in the bottom-left corner (or Alt+A), click any
 * element, type a note. Notes are saved through the dev server to
 * .annotations/notes.json with the page, a CSS selector for the element, its
 * text and the nearest heading, so they can be read and fixed from the
 * terminal. Each note shows as a numbered pin on its element; the panel lists
 * this page's notes and lets you mark them done or delete them.
 */
const API = '/__annotations'
const Z = 2147483000

/** A selector that finds this element again: an id if it has one, else a nth-of-type path. */
function selectorFor(el) {
  if (!(el instanceof Element)) return ''
  if (el.id) return `#${CSS.escape(el.id)}`
  const parts = []
  let node = el
  while (node && node.nodeType === 1 && node !== document.body && parts.length < 14) {
    if (node.id) {
      parts.unshift(`#${CSS.escape(node.id)}`)
      return parts.join(' > ')
    }
    let part = node.tagName.toLowerCase()
    const parent = node.parentElement
    if (parent) {
      const same = [...parent.children].filter((c) => c.tagName === node.tagName)
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`
    }
    parts.unshift(part)
    node = parent
  }
  return `body > ${parts.join(' > ')}`
}

const textOf = (el) =>
  String(el.innerText || el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('placeholder') || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)

const headingNear = (el) =>
  String(el.closest('section, article, .panel, main, form, header, footer')?.querySelector('h1, h2, h3')?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)

const isOurs = (el) => Boolean(el?.closest?.('[data-annotator]'))

async function api(method, id = '', body) {
  const res = await fetch(`${API}${id ? `/${encodeURIComponent(id)}` : ''}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Annotations ${method} failed: ${res.status}`)
  return res.json()
}

export default function Annotator() {
  const { pathname } = useLocation()
  const [on, setOn] = useState(false)
  const [notes, setNotes] = useState([])
  const [hover, setHover] = useState(null) // DOMRect of the hovered element
  const [draft, setDraft] = useState(null) // { target, x, y }
  const [text, setText] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [panel, setPanel] = useState(true)
  const [, setTick] = useState(0) // re-render pins on scroll / resize
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api('GET')
      .then((list) => {
        setNotes(list)
        setError('')
      })
      .catch(() => setError('Could not reach the notes store. Restart the dev server.'))
  }, [])

  useEffect(load, [load, pathname])

  // Alt+A toggles; Escape closes the draft, then leaves annotate mode.
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        setOn((v) => !v)
      } else if (e.key === 'Escape') {
        if (draft) setDraft(null)
        else if (on) setOn(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [on, draft])

  // While on: outline what is under the pointer, and turn the next click into a note.
  useEffect(() => {
    if (!on) {
      setHover(null)
      return undefined
    }
    const style = document.createElement('style')
    style.textContent = 'body *:not([data-annotator] *) { cursor: crosshair !important; }'
    document.head.appendChild(style)

    const onMove = (e) => {
      if (draft || isOurs(e.target)) return setHover(null)
      setHover(e.target.getBoundingClientRect())
    }
    const swallow = (e) => {
      if (isOurs(e.target)) return
      e.preventDefault()
      e.stopPropagation()
    }
    const onClick = (e) => {
      if (isOurs(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      if (draft) return
      setText('')
      setDraft({ target: e.target, x: e.clientX, y: e.clientY })
      setHover(e.target.getBoundingClientRect())
    }
    window.addEventListener('mousemove', onMove, true)
    window.addEventListener('pointerdown', swallow, true)
    window.addEventListener('mousedown', swallow, true)
    window.addEventListener('click', onClick, true)
    return () => {
      style.remove()
      window.removeEventListener('mousemove', onMove, true)
      window.removeEventListener('pointerdown', swallow, true)
      window.removeEventListener('mousedown', swallow, true)
      window.removeEventListener('click', onClick, true)
    }
  }, [on, draft])

  // Keep pins attached to their elements as the page scrolls, resizes or re-lays out.
  useEffect(() => {
    let raf = 0
    const bump = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setTick((t) => t + 1))
    }
    window.addEventListener('scroll', bump, true)
    window.addEventListener('resize', bump)
    const t = setInterval(bump, 1200)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(t)
      window.removeEventListener('scroll', bump, true)
      window.removeEventListener('resize', bump)
    }
  }, [])

  const pageNotes = useMemo(() => notes.filter((n) => n.page === pathname), [notes, pathname])
  const visible = pageNotes.filter((n) => showDone || n.status !== 'done')
  const openHere = pageNotes.filter((n) => n.status !== 'done').length
  const openElsewhere = notes.filter((n) => n.page !== pathname && n.status !== 'done').length

  const save = async () => {
    const note = text.trim()
    if (!note || !draft) return
    const el = draft.target
    const r = el.getBoundingClientRect()
    try {
      await api('POST', '', {
        page: pathname,
        selector: selectorFor(el),
        text: textOf(el),
        heading: headingNear(el),
        tag: el.tagName.toLowerCase(),
        note,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        rect: { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height },
        scrollY: window.scrollY,
      })
      setDraft(null)
      setText('')
      load()
    } catch {
      setError('Saving failed. Is the dev server running?')
    }
  }

  const setStatus = (n, status) => api('PATCH', n.id, { status }).then(load).catch(() => setError('Update failed.'))
  const remove = (n) => api('DELETE', n.id).then(load).catch(() => setError('Delete failed.'))

  const pinFor = (n) => {
    let el = null
    try {
      el = n.selector ? document.querySelector(n.selector) : null
    } catch {
      el = null
    }
    if (!el) return null
    const r = el.getBoundingClientRect()
    if (r.bottom < 0 || r.top > window.innerHeight) return null
    return { top: Math.max(4, r.top - 10), left: Math.max(4, Math.min(window.innerWidth - 28, r.left - 10)) }
  }

  const draftPos = draft
    ? {
        left: Math.max(12, Math.min(window.innerWidth - 332, draft.x + 12)),
        top: Math.max(12, Math.min(window.innerHeight - 220, draft.y + 12)),
      }
    : null

  return (
    <div data-annotator="" style={{ position: 'relative', zIndex: Z }}>
      {/* hover outline */}
      {on && hover && (
        <div
          className="pointer-events-none fixed rounded-md border-2 border-violet-500 bg-violet-500/10"
          style={{ zIndex: Z, top: hover.top - 2, left: hover.left - 2, width: hover.width + 4, height: hover.height + 4 }}
        />
      )}

      {/* numbered pins */}
      {visible.map((n) => {
        const pos = pinFor(n)
        if (!pos) return null
        const idx = pageNotes.indexOf(n) + 1
        return (
          <button
            key={n.id}
            type="button"
            title={n.note}
            onClick={() => setPanel(true)}
            className={`fixed grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white shadow-lg ring-2 ring-white ${
              n.status === 'done' ? 'bg-emerald-500' : 'bg-violet-600'
            }`}
            style={{ zIndex: Z, top: pos.top, left: pos.left }}
          >
            {n.status === 'done' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : idx}
          </button>
        )
      })}

      {/* new-note popover */}
      {draft && (
        <div
          className="fixed w-[320px] rounded-2xl border border-ink/10 bg-white p-3 text-ink shadow-2xl"
          style={{ zIndex: Z, ...draftPos }}
          role="dialog"
          aria-label="New note"
        >
          <p className="truncate text-[11px] text-slate-soft">
            {draft.target.tagName.toLowerCase()}
            {textOf(draft.target) ? ` · “${textOf(draft.target).slice(0, 48)}”` : ''}
          </p>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save()
            }}
            rows={3}
            placeholder="What should change here?"
            className="mt-2 w-full resize-none rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-soft">Ctrl+Enter to save</span>
            <span className="flex gap-1.5">
              <button type="button" onClick={() => setDraft(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-soft hover:bg-paper">
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!text.trim()}
                className="rounded-full bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Save note
              </button>
            </span>
          </div>
        </div>
      )}

      {/* corner controls */}
      <div className="fixed bottom-4 left-4 flex max-w-[calc(100vw-2rem)] flex-col items-start gap-2" style={{ zIndex: Z }}>
        {on && panel && (
          <div className="w-[300px] max-w-full rounded-2xl border border-ink/10 bg-white p-3 text-ink shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">Notes on this page</p>
              <button type="button" onClick={() => setPanel(false)} aria-label="Hide notes" className="rounded-full p-1 text-slate-soft hover:bg-paper">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-soft">
              Click anything on the page to add a note. {openElsewhere ? `${openElsewhere} open on other pages.` : ''}
            </p>
            {error && <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1 text-[11px] text-rose-700">{error}</p>}
            <ol className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
              {visible.length === 0 && <li className="text-xs text-slate-soft">No notes here yet.</li>}
              {visible.map((n) => (
                <li key={n.id} className="flex items-start gap-2 rounded-xl bg-paper px-2 py-1.5 text-xs">
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${n.status === 'done' ? 'bg-emerald-500' : 'bg-violet-600'}`}>
                    {pageNotes.indexOf(n) + 1}
                  </span>
                  <span className={`min-w-0 flex-1 ${n.status === 'done' ? 'text-slate-soft line-through' : ''}`}>{n.note}</span>
                  <button
                    type="button"
                    onClick={() => setStatus(n, n.status === 'done' ? 'open' : 'done')}
                    aria-label={n.status === 'done' ? 'Reopen' : 'Mark done'}
                    className="rounded-full p-1 text-slate-soft hover:bg-white hover:text-emerald-600"
                  >
                    {n.status === 'done' ? <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                  <button type="button" onClick={() => remove(n)} aria-label="Delete note" className="rounded-full p-1 text-slate-soft hover:bg-white hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
            <label className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-soft">
              <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="accent-violet-600" />
              Show done notes
            </label>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOn((v) => !v)}
            aria-pressed={on}
            title="Annotate mode (Alt+A)"
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-2xl transition ${
              on ? 'bg-violet-600 text-white' : 'border border-ink/10 bg-white text-ink hover:border-violet-400'
            }`}
          >
            {on ? <PenLine className="h-4 w-4" aria-hidden="true" /> : <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />}
            {on ? 'Annotating · Esc to stop' : 'Annotate'}
            {openHere > 0 && (
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${on ? 'bg-white text-violet-700' : 'bg-violet-600 text-white'}`}>
                {openHere}
              </span>
            )}
          </button>
          {on && !panel && (
            <button type="button" onClick={() => setPanel(true)} className="rounded-full border border-ink/10 bg-white px-3 py-2.5 text-xs font-semibold shadow-2xl">
              Show notes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
