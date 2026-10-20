import { useState } from 'react'
import Twin3D from '../../twin3d/index.jsx'
import StoryCard from '../ui/StoryCard.jsx'
import WeekGrid, { useWeekPlayer } from '../../charts/WeekGrid.jsx'
import { RISK } from '../../../utils/risk.js'
import { LOAD_LABEL, LOAD_NOTE, fmt, shortOrgan } from '../twinData.js'

/**
 * "Your twin changes when you do." Scrub or play through the persona's week;
 * for every day the body, the organ grid, the load and the flags are
 * recomputed by the engine — the same code path the app runs. The grid and
 * scrubber are the shared WeekGrid, which the in-app History page uses too.
 */
const CAFFEINE_LINE = 400
const PARACETAMOL_LINE = 3000
const PARACETAMOL_CEILING = 4000

function Meter({ label, value, note, pct, severity }) {
  const r = RISK[severity] || RISK.calm
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-soft">{label}</span>
        <span className="font-semibold">
          {value} <span className="text-[11px] font-normal text-slate-soft">· {note}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full" style={{ background: `${r.hex}29` }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: r.hex }}
        />
      </div>
    </div>
  )
}

export default function WeekCard({ story }) {
  const { days, firstName } = story
  const { idx, last, playing, toggle, pick, day } = useWeekPlayer(days)
  const [organ, setOrgan] = useState(null)

  return (
    <StoryCard
      n={2}
      eyebrow="Your week"
      title="Your twin changes"
      gradient="when you do."
      sub={`Play or drag through ${firstName}'s week. The body, the flags and the figures are recomputed for every day by the same engine that runs the app — not an animation.`}
    >
      <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-10">
        <div className="min-w-0">
          <div className="stage-backdrop relative mx-auto h-[340px] w-full max-w-[300px] overflow-hidden rounded-[22px]">
            <Twin3D organRisk={day.state.organRisk} selected={organ} onSelect={setOrgan} />
            <span className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-frost">
              {idx === last ? 'Today' : day.dateLabel}
            </span>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-soft">Drag to rotate · tap an organ</p>
        </div>

        <div className="min-w-0">
          <WeekGrid days={days} idx={idx} playing={playing} onPick={pick} onToggle={toggle} name={`${firstName}'s`} />

          <div className="mt-6 border-t border-ink/10 pt-5" aria-live="polite">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-extrabold leading-none tracking-[-0.03em]">{day.bodyIndex}</span>
                <span className="text-xs text-slate-soft">{LOAD_LABEL.toLowerCase()} · of 100</span>
              </div>
              <span className="text-xs font-semibold">
                {day.state.flags.length} flag{day.state.flags.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <Meter
                label="Caffeine"
                value={`${fmt(day.caffeine)} mg`}
                note={`~${CAFFEINE_LINE} mg/day line`}
                pct={(day.caffeine / Math.max(day.caffeine, CAFFEINE_LINE * 2.5)) * 100}
                severity={day.caffeine >= CAFFEINE_LINE ? 'caution' : 'calm'}
              />
              <Meter
                label="Paracetamol"
                value={`${fmt(day.paracetamol)} mg`}
                note={`ceiling ${fmt(PARACETAMOL_CEILING)} mg`}
                pct={(day.paracetamol / PARACETAMOL_CEILING) * 100}
                severity={day.paracetamol >= PARACETAMOL_LINE ? 'caution' : day.paracetamol > 0 ? 'watch' : 'calm'}
              />
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-soft">Flags on this day</div>
              {day.state.flags.length ? (
                <ul className="mt-2 space-y-1.5">
                  {day.state.flags.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: RISK[f.severity].hex }} aria-hidden="true" />
                      <span className="font-semibold">{shortOrgan(f.organ)}</span>
                      <span className="min-w-0 truncate text-slate-soft">— {f.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-soft">None. Everything logged sits inside the usual lines.</p>
              )}
            </div>
            <p className="mt-4 text-[11px] leading-snug text-slate-soft">{LOAD_NOTE}</p>
          </div>
        </div>
      </div>
    </StoryCard>
  )
}
