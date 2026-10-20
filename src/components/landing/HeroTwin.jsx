import { useState } from 'react'
import Twin3D from '../twin3d/index.jsx'
import { RISK } from '../../utils/risk.js'
import { BentoCard } from './ui/BentoCard.jsx'
import NumberTicker from './ui/NumberTicker.jsx'
import Delta from './ui/Delta.jsx'
import Reveal from './ui/Reveal.jsx'
import { LOAD_LABEL, LOAD_NOTE, shortOrgan } from './twinData.js'

const SHOWN_ORGANS = ['heart', 'liver', 'brain']

/**
 * The product, right under the hero copy: the live WebGL twin on today's
 * engine state with the headline numbers. Same cell the bento used to carry,
 * moved up so the first screen shows the product.
 */
export default function HeroTwin({ story }) {
  const [organ, setOrgan] = useState(null)
  const { firstName, today, yesterday, first } = story
  const flagCount = today.state.flags.length

  return (
    <Reveal delay={0.3} className="mt-12 text-left">
      <BentoCard dark>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-mist">{firstName}'s twin</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] font-semibold text-mist">
              <span className="h-1.5 w-1.5 rounded-full bg-risk-calm motion-safe:animate-pulseGlow" />
              Live · {today.dateLabel}
            </span>
          </div>

          <div className="mt-4 grid flex-1 gap-5 sm:grid-cols-[minmax(200px,44%)_1fr]">
            <div className="stage-backdrop h-[280px] overflow-hidden rounded-[20px] sm:h-full sm:min-h-[320px]">
              <Twin3D organRisk={today.state.organRisk} selected={organ} onSelect={setOrgan} showLabels={false} />
            </div>

            <div className="flex flex-col justify-center">
              <div className="text-xs text-mist">{LOAD_LABEL}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <NumberTicker value={today.bodyIndex} className="font-display text-6xl font-extrabold leading-none tracking-tight text-frost" />
                <span className="text-sm text-mist">of 100</span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-mist">
                <div className="flex items-center gap-1.5">
                  <Delta prev={yesterday.bodyIndex} cur={today.bodyIndex} /> since yesterday
                </div>
                <div className="flex items-center gap-1.5">
                  <Delta prev={first.bodyIndex} cur={today.bodyIndex} /> this week
                </div>
              </div>

              <div className="mt-4 text-sm font-semibold text-frost">
                {flagCount} active flag{flagCount === 1 ? '' : 's'}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-hairline pt-3">
                {SHOWN_ORGANS.map((k) => {
                  const sev = today.state.organRisk[k]?.severity || 'calm'
                  return (
                    <button
                      key={k}
                      onClick={() => setOrgan(organ === k ? null : k)}
                      aria-pressed={organ === k}
                      className={`rounded-[12px] px-2 py-1.5 text-left transition hover:bg-panel ${
                        organ === k ? 'bg-panel ring-1 ring-brand-400/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-mist">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: RISK[sev].hex }} />
                        {shortOrgan(k)}
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1.5 text-frost">
                        <span className="text-xl font-extrabold leading-none">{today.organ[k]}</span>
                        <Delta prev={yesterday.organ[k]} cur={today.organ[k]} />
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[11px] leading-snug text-mist/80">{LOAD_NOTE}</p>
            </div>
          </div>
        </div>
      </BentoCard>
    </Reveal>
  )
}
