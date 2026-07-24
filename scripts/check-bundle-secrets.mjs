/**
 * Fails the build if anything that looks like a real secret made it into the
 * client bundle. `VITE_`-prefixed variables are inlined into public JS by
 * design, so a single careless env var publishes a live key — which has
 * happened here once already.
 *
 * Run automatically after `npm run build`, and in CI.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'

// Patterns for provider keys that must never reach the browser.
const PATTERNS = [
  [/sk-proj-[A-Za-z0-9_-]{20,}/, 'OpenAI project key'],
  [/sk-[A-Za-z0-9]{32,}/, 'OpenAI secret key'],
  [/holon_[A-Za-z0-9_-]{20,}/, 'HOLON key'],
  [/gh[pousr]_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key id'],
]

if (!existsSync(DIST)) {
  console.error(`[secrets] no ${DIST}/ to scan — run the build first`)
  process.exit(1)
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })

const found = []
for (const file of walk(DIST)) {
  if (!/\.(js|css|html|json|map)$/.test(file)) continue
  const text = readFileSync(file, 'utf8')
  for (const [re, label] of PATTERNS) {
    const m = text.match(re)
    if (m) found.push({ file, label, sample: `${m[0].slice(0, 12)}…` })
  }
}

if (found.length) {
  console.error('\n[secrets] SECRET FOUND IN CLIENT BUNDLE — build refused\n')
  for (const f of found) console.error(`  ${f.label}  in ${f.file}  (${f.sample})`)
  console.error('\nRevoke that key now, then keep it off any VITE_ variable in production.\n')
  process.exit(1)
}

console.log('[secrets] clean — no provider keys in the client bundle')
