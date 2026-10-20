import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { RISK } from '../../utils/risk.js'
import { ORGANS } from '../../services/mock/mockData.js'

/**
 * The organ-by-day grid with a play/scrub control. Used by the landing
 * story card and the in-app History page, so the week reads the same way
 * everywhere. Controlled: pair it with useWeekPlayer().
 *
 * `days` is the array buildDays() returns (components/landing/twinData.js).
 */
export const TRACKED_ORGANS = ['heart', 'liver', 'brain', 'kidneys']
const shortOrgan = (key) => ORGANS[key].label.split(' &')[0]

export function useWeekPlayer(days) {
  const last = Math.max(0, days.length - 1)
  const [idx, setIdx] = useState(last)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setIdx(last)
  }, [last])

  useEffect(() => {
    if (!playing) return undefined
    const t = setInterval(() => setIdx((i) => Math.min(i + 1, last)), 1100)
    return () => clearInterval(t)
  }, [playing, last])

  useEffect(() => {
    if (playing && idx >= last) setPlaying(false)
  }, [playing, idx, last])

  const toggle = () => {
    if (playing) return setPlaying(false)
    if (idx >= last) setIdx(0)
    setPlaying(true)
  }
  const pick = (i) => {
    setPlaying(false)
    setIdx(Math.max(0, Math.min(last, i)))
  }
  return { idx, last, playing, toggle, pick, day: days[idx] }
}

export default function WeekGrid({ days, idx, playing, onPick, onToggle, organs = TRACKED_ORGANS, name = 'the' }) {
  const last = days.length - 1
  if (!days.length) return null
  return (
    <div>
      <div className="grid grid-cols-[60px_1fr] gap-x-3 gap-y-1 sm:grid-cols-[80px_1fr]">
        <div />
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <button
              key={d.label}
              type="button"
              onClick={() => onPick(i)}
              aria-pressed={i === idx}
              className={`rounded-full py-1 text-center text-[11px] font-semibold transition ${
                i === idx ? 'bg-brand-grad text-white' : 'text-slate-soft hover:bg-violet-50'
              }`}
            >
              <span className="sm:hidden">{d.date.getDate()}</span>
              <span className="hidden sm:inline">{i === last ? 'Today' : d.dateLabel}</span>
            </button>
          ))}
        </div>

        {organs.map((k) => (
          <div key={k} className="contents">
            <div className="flex items-center text-xs text-slate-soft">{shortOrgan(k)}</div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                const sev = d.state.organRisk[k]?.severity || 'calm'
                return (
                  <div
                    key={d.label}
                    className={`flex h-7 items-center justify-center rounded-xl ${i === idx ? 'bg-violet-50' : ''}`}
                    title={`${shortOrgan(k)} · ${d.dateLabel} · ${sev}`}
                  >
                    <span className="sr-only">{`${d.dateLabel}: ${sev}`}</span>
                    <span
                      aria-hidden="true"
                      className="block rounded-full"
                      style={{
                        background: RISK[sev].hex,
                        width: sev === 'calm' ? 6 : 11,
                        height: sev === 'calm' ? 6 : 11,
                        opacity: i === idx ? 1 : 0.55,
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center text-xs text-slate-soft">Load</div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <div
              key={d.label}
              className={`flex h-7 items-center justify-center rounded-xl text-xs font-semibold ${
                i === idx ? 'bg-violet-50 text-ink' : 'text-slate-soft'
              }`}
            >
              {d.bodyIndex}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[60px_1fr] items-center gap-3 sm:grid-cols-[80px_1fr]">
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? 'Pause the week' : 'Play the week'}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-violet-400"
        >
          {playing ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
          <span className="hidden sm:inline">{playing ? 'Pause' : 'Play'}</span>
        </button>
        <input
          type="range"
          min={0}
          max={last}
          value={idx}
          onChange={(e) => onPick(Number(e.target.value))}
          className="w-full accent-violet-600"
          aria-label={`Day of ${name} week`}
          aria-valuetext={days[idx].dateLabel}
        />
      </div>
    </div>
  )
}
