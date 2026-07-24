import Twin3D from '../twin3d/index.jsx'
import { RISK } from '../../utils/risk.js'
import { LOAD_LABEL, LOAD_NOTE, shortOrgan } from './twinData.js'

/**
 * The product, in the hero — not an illustration. The body is the live WebGL
 * twin on today's engine state (click an organ to open its evidence); the
 * figures are the engine's; the "what changed" feed is a diff of the
 * persona's actual week, and each flag in it opens the evidence panel.
 */

const SHOWN_ORGANS = ['heart', 'liver', 'brain']

/** Direction of a load number, where higher is worse. */
export function Delta({ prev, cur, size = 'sm' }) {
  const diff = cur - prev
  const tone = diff > 0 ? RISK.caution.hex : diff < 0 ? RISK.calm.hex : '#9AA3B2'
  const glyph = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
  return (
    <span className={`inline-flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} text-slate-soft`}>
      <span className="font-bold" style={{ color: tone }} aria-hidden="true">
        {glyph}
      </span>
      <span className="sr-only">{diff > 0 ? 'up' : diff < 0 ? 'down' : 'unchanged'}</span>
      {diff !== 0 && <span>{Math.abs(diff)}</span>}
    </span>
  )
}

export default function LiveTwin({ story, onSelectFlag, selectedOrgan, onSelectOrgan }) {
  const { firstName, today, yesterday, weekDelta, headline } = story
  const flagCount = today.state.flags.length

  return (
    <div className="card-glass rounded-[28px] p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-soft">
          {firstName}'s twin
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/60 px-2.5 py-1 text-[11px] font-semibold text-slate-soft">
          <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-risk-calm" />
          Live · {today.dateLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[150px_1fr] gap-5 sm:grid-cols-[190px_1fr]">
        <div className="stage-backdrop h-[250px] min-w-0 overflow-hidden rounded-[22px] sm:h-[290px]">
          <Twin3D
            organRisk={today.state.organRisk}
            selected={selectedOrgan}
            onSelect={onSelectOrgan}
            showLabels={false}
          />
        </div>

        <div className="flex flex-col justify-center">
          <div className="text-xs text-slate-soft">{LOAD_LABEL}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold leading-none tracking-tight">{today.bodyIndex}</span>
            <span className="text-sm text-slate-soft">of 100</span>
          </div>
          <div className="mt-2 space-y-1 text-xs text-slate-soft">
            <div className="flex items-center gap-1.5">
              <Delta prev={yesterday.bodyIndex} cur={today.bodyIndex} /> since yesterday
            </div>
            <div className="flex items-center gap-1.5">
              <Delta prev={today.bodyIndex - weekDelta} cur={today.bodyIndex} /> this week
            </div>
          </div>
          <div className="mt-3 text-sm font-semibold">
            {flagCount} active flag{flagCount === 1 ? '' : 's'}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-slate-soft/80">{LOAD_NOTE}</p>
        </div>
      </div>

      {/* Organ loads */}
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-ink/10 pt-4">
        {SHOWN_ORGANS.map((k) => {
          const sev = today.state.organRisk[k]?.severity || 'calm'
          return (
            <button
              key={k}
              onClick={() => onSelectOrgan?.(k)}
              className={`rounded-[14px] px-2 py-1.5 text-left transition hover:bg-white/70 ${
                selectedOrgan === k ? 'bg-white/80 ring-1 ring-brand-100' : ''
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-soft">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: RISK[sev].hex }} />
                {shortOrgan(k)}
                <span className="hidden capitalize sm:inline">· {sev}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold leading-none">{today.organ[k]}</span>
                <Delta prev={yesterday.organ[k]} cur={today.organ[k]} />
              </div>
            </button>
          )
        })}
      </div>

      {/* What changed */}
      <div className="mt-5 border-t border-ink/10 pt-4">
        <div className="text-sm font-bold">What changed?</div>
        <ol className="mt-3 space-y-2.5">
          {headline.map((c) => {
            const clickable = Boolean(c.flagId)
            const Row = clickable ? 'button' : 'div'
            return (
              <li key={`${c.date}-${c.title}`}>
                <Row
                  onClick={clickable ? () => onSelectFlag?.(c.flagId) : undefined}
                  className={`grid w-full grid-cols-[52px_1fr] gap-3 rounded-[14px] px-1.5 py-1 text-left ${
                    clickable ? 'transition hover:bg-white/70' : ''
                  }`}
                >
                  <span className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">
                    {c.date}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: RISK[c.severity].hex }} />
                      {c.title}
                      {clickable && <span className="ml-auto text-[11px] font-semibold text-brand-600">evidence →</span>}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-soft">
                      <span aria-hidden="true">↳ </span>
                      {c.detail}
                    </span>
                  </span>
                </Row>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="mt-4 text-right">
        <a href="#ask" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          Ask your twin →
        </a>
      </div>
    </div>
  )
}
