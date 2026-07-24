/**
 * Everything the landing page shows about "the twin" is computed HERE, from
 * the real engine, over a real persona's week — never typed in by hand. If a
 * rule or a persona's history changes, the hero, the timeline, the "what
 * changed" feed and the evidence panel all move with it.
 *
 * The story persona is Ada: her week carries two dated, causal events (a heart
 * flag when caffeine crossed the line, a liver flag when paracetamol did), which
 * is exactly what a "what changed, and why" page needs.
 */
import { PERSONAS, ORGANS } from '../../services/mock/mockData.js'
import {
  buildContext,
  deriveTwinState,
  computeOrganExposure,
  computeBodyIndex,
  normalizeItems,
  SEVERITY_BASE,
} from '../../services/mock/engine.js'

export const STORY_PERSONA = 'ada'
export const ORGAN_KEYS = Object.keys(ORGANS)

// Mirror the two threshold rules the story turns on (see INTERACTION_RULES).
const CAFFEINE_LINE = 400
const PARACETAMOL_LINE = 3000

const clamp = (n) => Math.max(6, Math.min(100, Math.round(n)))
export const fmt = (n) => Number(n).toLocaleString('en-US')
export const shortOrgan = (key) => ORGANS[key].label.split(' &')[0]

/** "6d ago" | "Yesterday" | "Today" → offset in days from today. */
function dayOffset(label) {
  if (label === 'Today') return 0
  if (label === 'Yesterday') return -1
  const m = /^(\d+)d ago$/.exec(label)
  return m ? -Number(m[1]) : 0
}

const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** Per-organ stress (6–100): severity baseline + sub-clinical exposure. Same math as computeBodyIndex. */
export function organStress(items) {
  const { organRisk } = deriveTwinState(items)
  const exposure = computeOrganExposure(items)
  const out = {}
  for (const k of ORGAN_KEYS) {
    out[k] = clamp(SEVERITY_BASE[organRisk[k]?.severity || 'calm'] + (exposure[k] || 0))
  }
  return out
}

/** Which logged substances contribute caffeine today, and how much each. */
export function caffeineBreakdown(items) {
  return normalizeItems(items)
    .filter((it) => it.def.tags.includes('caffeine'))
    .map((it) => ({
      name: it.def.label.split(' (')[0],
      mg: (it.def.caffeinePerUnit || 0) * (Number(it.dose) || 1) * it.times,
      detail: `${it.dose} ${it.def.unit}${it.dose > 1 ? 's' : ''} × ${it.times}/day`,
    }))
    .sort((a, b) => b.mg - a.mg)
}

function triggerText(flag, day) {
  if (flag.id === 'caffeine-stimulant-heart') {
    return `caffeine reached ${fmt(day.caffeine)} mg, over the ~${CAFFEINE_LINE} mg/day line`
  }
  if (flag.id === 'paracetamol-overuse') {
    return `paracetamol reached ${fmt(day.paracetamol)} mg, at the ~${fmt(PARACETAMOL_LINE)} mg/day line`
  }
  return `${flag.substances.map((s) => s.label.split(' (')[0]).join(' + ')} logged together`
}

/**
 * Diff consecutive days into dated events: a flag appearing or clearing, or a
 * meaningful caffeine move on a day with no flag change. Newest first.
 */
function computeChanges(days) {
  const out = []
  for (let i = 1; i < days.length; i += 1) {
    const d = days[i]
    const p = days[i - 1]

    for (const f of d.state.flags.filter((x) => !p.flagIds.includes(x.id))) {
      out.push({
        date: d.dateLabel,
        kind: 'flag',
        organ: f.organ,
        severity: f.severity,
        title: `${shortOrgan(f.organ)} flag appeared`,
        detail: triggerText(f, d),
        sub: f.title,
      })
    }
    for (const f of p.state.flags.filter((x) => !d.flagIds.includes(x.id))) {
      out.push({
        date: d.dateLabel,
        kind: 'clear',
        organ: f.organ,
        severity: 'calm',
        title: `${shortOrgan(f.organ)} flag cleared`,
        detail: f.title,
        sub: '',
      })
    }
    const flagChanged = d.flagIds.join() !== p.flagIds.join()
    if (!flagChanged && p.caffeine > 0) {
      const pct = Math.round(((d.caffeine - p.caffeine) / p.caffeine) * 100)
      if (Math.abs(pct) >= 10) {
        out.push({
          date: d.dateLabel,
          kind: pct < 0 ? 'better' : 'worse',
          organ: 'heart',
          severity: pct < 0 ? 'calm' : 'watch',
          title: `Caffeine ${pct < 0 ? 'down' : 'up'} ${Math.abs(pct)}%`,
          detail: `${fmt(p.caffeine)} → ${fmt(d.caffeine)} mg`,
          sub: `heart stress ${p.organ.heart} → ${d.organ.heart}`,
        })
      }
    }
  }
  return out.reverse()
}

/** The three events worth a hero panel: flag events first, then the newest move. */
export function headlineChanges(changes, n = 3) {
  const flags = changes.filter((c) => c.kind === 'flag' || c.kind === 'clear')
  const rest = changes.filter((c) => c.kind !== 'flag' && c.kind !== 'clear')
  const picked = [...flags, ...rest].slice(0, n)
  return changes.filter((c) => picked.includes(c)) // back in newest-first order
}

export function buildTwinStory(personaId = STORY_PERSONA, today = new Date()) {
  const persona = PERSONAS.find((p) => p.id === personaId)
  if (!persona) throw new Error(`No persona "${personaId}"`)

  const days = persona.history.map((d, i) => {
    const ctx = buildContext(d.items)
    const state = deriveTwinState(d.items)
    const date = new Date(today)
    date.setDate(today.getDate() + dayOffset(d.day))
    return {
      i,
      label: d.day,
      date,
      dateLabel: fmtDate(date),
      items: d.items,
      state,
      organ: organStress(d.items),
      bodyIndex: computeBodyIndex(d.items),
      caffeine: ctx.totalCaffeine(),
      paracetamol: ctx.dailyMg('paracetamol'),
      flagIds: state.flags.map((f) => f.id),
    }
  })

  const todayD = days[days.length - 1]
  const yesterday = days[days.length - 2]
  const first = days[0]
  const changes = computeChanges(days)

  return {
    persona,
    firstName: persona.name.split(',')[0],
    days,
    today: todayD,
    yesterday,
    first,
    weekDelta: todayD.bodyIndex - first.bodyIndex,
    dayDelta: todayD.bodyIndex - yesterday.bodyIndex,
    changes,
    headline: headlineChanges(changes),
    caffeineSources: caffeineBreakdown(todayD.items),
  }
}
