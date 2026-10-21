// Print the notes made in the browser's annotate mode, grouped by page.
//   npm run notes          → open notes
//   npm run notes -- --all → every note, including done ones
import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve(process.cwd(), '.annotations', 'notes.json')
const all = process.argv.includes('--all')

let notes = []
try {
  notes = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch {
  console.log('No notes yet. Run `npm run dev`, open the site and press "Annotate" (bottom-left) or Alt+A.')
  process.exit(0)
}

const shown = all ? notes : notes.filter((n) => n.status !== 'done')
if (!shown.length) {
  console.log(all ? 'No notes.' : `No open notes (${notes.length} done). Use --all to list them.`)
  process.exit(0)
}

const byPage = new Map()
for (const n of shown) {
  if (!byPage.has(n.page)) byPage.set(n.page, [])
  byPage.get(n.page).push(n)
}
for (const [page, list] of byPage) {
  console.log(`\n${page}`)
  for (const n of list) {
    const where = [n.heading && `in "${n.heading}"`, n.text && `on "${n.text.slice(0, 60)}"`].filter(Boolean).join(' ')
    console.log(`  [${n.status === 'done' ? 'x' : ' '}] ${n.id}  ${n.note}`)
    if (where) console.log(`        ${where}`)
    console.log(`        ${n.tag} · ${n.selector}`)
  }
}
console.log(`\n${shown.length} note${shown.length === 1 ? '' : 's'}${all ? '' : ' open'}.`)
