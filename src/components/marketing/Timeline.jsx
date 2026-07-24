import { useEffect, useState } from 'react'
import Twin3D from '../twin3d/index.jsx'
import { RISK } from '../../utils/risk.js'
import { LOAD_LABEL, LOAD_NOTE, fmt, shortOrgan } from './twinData.js'
import { Meter } from './Charts.jsx'

/**
 * "Your twin changes when you do." A scrubber across the persona's week. For
 * each day the body, the flags and the figures are recomputed by the engine —
 * the same code path the app runs. The 3D twin stages each change (pulse →
 * glow → label), so dragging reads as the body reacting, not a repaint.
 */

const TRACKED = ['heart', 'liver', 'brain', 'kidneys']

export default function Timeline({ story, onSelectFlag, selectedOrgan, onSelectOrgan }) {
  const { days, firstName } = story
  const last = days.length - 1
  const [idx, setIdx] = useState(last)
  const [playing, setPlaying] = useState(false)
  const day = days[idx]

  useEffect(() => {
    if (!playing) return undefined
    const t = setInterval(() => {
      setIdx((i) => {
        if (i >= last) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, 1100)
    return () => clearInterval(t)
  }, [playing, last])

  const play = () => {
    setIdx(0)
    setPlaying(true)
  }

  return (
    <div className="card-glass rounded-[28px] p-5 sm:p-7">
      <div className="grid gap-8 md:grid-cols-[320px_1fr] md:gap-10">
        {/* The body for the selected day */}
        <div className="min-w-0">
          <div className="stage-backdrop relative mx-auto h-[400px] w-full min-w-0 max-w-[320px] overflow-hidden rounded-[22px]">
            <Twin3D organRisk={day.state.organRisk} selected={selectedOrgan} onSelect={onSelectOrgan} />
            <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-frost">
              {idx === last ? 'Today' : day.dateLabel}
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-soft">Click an organ to open its evidence · move to rotate</p>
        </div>

        <div className="min-w-0">
          {/* Day strip */}
          <div className="grid grid-cols-[64px_1fr] gap-3 sm:grid-cols-[88px_1fr]">
            <div />
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => (
                <button
                  key={d.label}
                  onClick={() => {
                    setPlaying(false)
                    setIdx(i)
                  }}
                  className={`rounded-[10px] py-1 text-center text-[11px] font-semibold transition ${
                    i === idx ? 'bg-ink text-white' : 'text-slate-soft hover:bg-white/70'
                  }`}
                  aria-pressed={i === idx}
                >
                  <span className="sm:hidden">{d.date.getDate()}</span>
                  <span className="hidden sm:inline">{i === last ? 'Today' : d.dateLabel}</span>
                </button>
              ))}
            </div>

            {TRACKED.map((k) => (
              <div key={k} className="contents">
                <div className="flex items-center text-xs text-slate-soft">{shortOrgan(k)}</div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((d, i) => {
                    const sev = d.state.organRisk[k]?.severity || 'calm'
                    return (
                      <div
                        key={d.label}
                        className={`flex h-7 items-center justify-center rounded-[10px] ${i === idx ? 'bg-white/70' : ''}`}
                        title={`${shortOrgan(k)} · ${d.dateLabel} · ${sev} · load ${d.organ[k]}`}
                      >
                        <span
                          className="block rounded-full"
                          style={{
                            background: RISK[sev].hex,
                            width: sev === 'calm' ? 6 : 10,
                            height: sev === 'calm' ? 6 : 10,
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
                  className={`flex h-7 items-center justify-center rounded-[10px] text-xs font-semibold ${
                    i === idx ? 'bg-white/70 text-ink' : 'text-slate-soft'
                  }`}
                >
                  {d.bodyIndex}
                </div>
              ))}
            </div>
          </div>

          {/* Scrubber */}
          <div className="mt-4 grid grid-cols-[64px_1fr] items-center gap-3 sm:grid-cols-[88px_1fr]">
            <button
              onClick={playing ? () => setPlaying(false) : play}
              className="btn-glass rounded-full px-3 py-1.5 text-xs font-semibold"
            >
              {playing ? '■ Stop' : '▶ Play'}
            </button>
            <input
              type="range"
              min={0}
              max={last}
              value={idx}
              onChange={(e) => {
                setPlaying(false)
                setIdx(Number(e.target.value))
              }}
              className="twin-range w-full"
              aria-label={`Day of ${firstName}'s week`}
              aria-valuetext={day.dateLabel}
            />
          </div>

          {/* The selected day's numbers */}
          <div className="mt-6 border-t border-ink/10 pt-5">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold leading-none">{day.bodyIndex}</span>
                <span className="text-xs text-slate-soft">{LOAD_LABEL.toLowerCase()} · of 100</span>
              </div>
              <span className="text-xs font-semibold">
                {day.state.flags.length} flag{day.state.flags.length === 1 ? '' : 's'}
              </span>
            </div>

            <dl className="mt-4 space-y-3">
              <Row label="Caffeine" value={`${fmt(day.caffeine)} mg`} pct={Math.min(100, (day.caffeine / 1400) * 100)} severity={day.caffeine >= 400 ? 'caution' : 'calm'} note="~400 mg/day line" />
              <Row label="Paracetamol" value={`${fmt(day.paracetamol)} mg`} pct={(day.paracetamol / 4000) * 100} severity={day.paracetamol >= 3000 ? 'caution' : day.paracetamol > 0 ? 'watch' : 'calm'} note="ceiling 4,000 mg" />
            </dl>

            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-soft">Flags on this day</div>
              {day.state.flags.length ? (
                <ul className="mt-2 space-y-1">
                  {day.state.flags.map((f) => (
                    <li key={f.id}>
                      <button
                        onClick={() => onSelectFlag?.(f.id)}
                        className="flex w-full items-center gap-2 rounded-[10px] px-1.5 py-1 text-left text-sm transition hover:bg-white/70"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: RISK[f.severity].hex }} />
                        <span className="font-semibold">{shortOrgan(f.organ)}</span>
                        <span className="min-w-0 truncate text-slate-soft">— {f.title}</span>
                        <span className="ml-auto shrink-0 text-[11px] font-semibold text-brand-600">evidence →</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-soft">None. Everything logged sits inside the usual lines.</p>
              )}
            </div>
            <p className="mt-4 text-[11px] leading-snug text-slate-soft/80">{LOAD_NOTE}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, pct, severity, note }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <dt className="text-slate-soft">{label}</dt>
        <dd className="font-semibold">
          {value} <span className="text-[11px] font-normal text-slate-soft">· {note}</span>
        </dd>
      </div>
      <Meter value={pct} max={100} severity={severity} className="mt-1.5" />
    </div>
  )
}
