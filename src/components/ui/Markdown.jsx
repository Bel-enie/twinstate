/**
 * Tiny dependency-free Markdown renderer for chat answers.
 * Handles headings (#..####), bullet & numbered lists, paragraphs, **bold** and
 * *italic* — enough to render ChatGPT-style structured answers cleanly.
 */
function renderInline(str, keyBase) {
  // Split on **bold** and *italic* while keeping the delimiters.
  const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  return parts.map((p, i) => {
    const key = `${keyBase}-${i}`
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={key}>{p.slice(2, -2)}</strong>
    if (/^\*[^*]+\*$/.test(p)) return <em key={key}>{p.slice(1, -1)}</em>
    return <span key={key}>{p}</span>
  })
}

export default function Markdown({ text = '' }) {
  const lines = String(text).split('\n')
  const out = []
  let para = []
  let list = null
  let ordered = false
  let k = 0

  const flushPara = () => {
    if (para.length) {
      out.push(
        <p key={`p${k++}`} className="text-sm leading-relaxed">
          {renderInline(para.join(' '), `p${k}`)}
        </p>
      )
      para = []
    }
  }
  const flushList = () => {
    if (list && list.length) {
      const items = list.map((it, i) => (
        <li key={i}>{renderInline(it, `l${k}-${i}`)}</li>
      ))
      out.push(
        ordered ? (
          <ol key={`o${k++}`} className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">
            {items}
          </ol>
        ) : (
          <ul key={`u${k++}`} className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {items}
          </ul>
        )
      )
    }
    list = null
  }

  for (const raw of lines) {
    const t = raw.trim()
    const h = t.match(/^#{1,4}\s+(.*)/)
    const b = t.match(/^[-*]\s+(.*)/)
    const n = t.match(/^\d+\.\s+(.*)/)

    if (!t) {
      flushPara()
      flushList()
      continue
    }
    if (h) {
      flushPara()
      flushList()
      out.push(
        <h4 key={`h${k++}`} className="mt-1 text-sm font-bold">
          {renderInline(h[1], `h${k}`)}
        </h4>
      )
      continue
    }
    if (b) {
      flushPara()
      if (list && ordered) flushList()
      ordered = false
      list = list || []
      list.push(b[1])
      continue
    }
    if (n) {
      flushPara()
      if (list && !ordered) flushList()
      ordered = true
      list = list || []
      list.push(n[1])
      continue
    }
    flushList()
    para.push(t)
  }
  flushPara()
  flushList()

  return <div className="space-y-2">{out}</div>
}
