/**
 * Dev-server-only notes store for the in-browser annotate mode
 * (src/dev/Annotator.jsx). Notes live in .annotations/notes.json at the repo
 * root, so they can be read from the terminal (`npm run notes`) and acted on.
 *
 *   GET    /__annotations        → all notes
 *   POST   /__annotations        → add a note
 *   PATCH  /__annotations/<id>   → update { note, status }
 *   DELETE /__annotations/<id>   → remove a note
 *
 * `apply: 'serve'` keeps it out of production builds entirely.
 */
import fs from 'node:fs'
import path from 'node:path'

const MAX_BODY = 100_000
const STATUSES = new Set(['open', 'done'])

const clip = (v, n) => String(v ?? '').slice(0, n)
const num = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0)

function sanitize(b = {}) {
  return {
    page: clip(b.page, 200) || '/',
    selector: clip(b.selector, 600),
    text: clip(b.text, 160),
    heading: clip(b.heading, 120),
    tag: clip(b.tag, 20),
    note: clip(b.note, 2000).trim(),
    viewport: { w: num(b.viewport?.w), h: num(b.viewport?.h) },
    rect: { x: num(b.rect?.x), y: num(b.rect?.y), w: num(b.rect?.w), h: num(b.rect?.h) },
    scrollY: num(b.scrollY),
  }
}

export default function annotations() {
  const dir = path.resolve(process.cwd(), '.annotations')
  const file = path.join(dir, 'notes.json')
  const read = () => {
    try {
      const list = JSON.parse(fs.readFileSync(file, 'utf8'))
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }
  const write = (list) => {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(file, `${JSON.stringify(list, null, 2)}\n`)
  }

  return {
    name: 'twinstate-annotations',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__annotations', (req, res) => {
        const send = (code, body) => {
          res.statusCode = code
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        const id = decodeURIComponent((req.url || '/').split('?')[0].replace(/^\/+/, ''))

        if (req.method === 'GET') return send(200, read())

        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk
          if (raw.length > MAX_BODY) req.destroy()
        })
        req.on('end', () => {
          let body = {}
          try {
            body = raw ? JSON.parse(raw) : {}
          } catch {
            return send(400, { error: 'Invalid JSON' })
          }
          if (!body || typeof body !== 'object') return send(400, { error: 'Expected an object' })
          const list = read()

          if (req.method === 'POST') {
            const note = sanitize(body)
            if (!note.note) return send(400, { error: 'Note text is required' })
            const saved = {
              id: `n${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
              status: 'open',
              createdAt: new Date().toISOString(),
              ...note,
            }
            list.push(saved)
            write(list)
            return send(201, saved)
          }

          const i = list.findIndex((n) => n.id === id)
          if (i < 0) return send(404, { error: 'Note not found' })

          if (req.method === 'PATCH') {
            if (typeof body.note === 'string' && body.note.trim()) list[i].note = clip(body.note, 2000).trim()
            if (STATUSES.has(body.status)) list[i].status = body.status
            list[i].updatedAt = new Date().toISOString()
            write(list)
            return send(200, list[i])
          }
          if (req.method === 'DELETE') {
            const [gone] = list.splice(i, 1)
            write(list)
            return send(200, gone)
          }
          return send(405, { error: 'Method not allowed' })
        })
      })
    },
  }
}
