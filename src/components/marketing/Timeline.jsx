import { useEffect, useState } from 'react'
import AnatomyModel from '../anatomy/AnatomyModel.jsx'
import { RISK } from '../../utils/risk.js'
import { fmt, shortOrgan } from './twinData.js'
import { Meter } from './Charts.jsx'

/**
 * "Your twin changes when you do." A scrubber across the persona's week. For
 * each day the body, the flags and the figures are recomputed by the engine —
 * this is the same code path the app runs, not a canned animation.
 */

const TRACKED = ['heart', 'liver', 'brain', 'kidneys']

export default function Timeline({ story }) {
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
    }, 750)
    return () => clearInterval(t)
  }, [playing, last])

  const play = () => {
    setIdx(0)
    setPlaying(true)
  }

  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card sm:p-7">
      {/* Day strip: one column per day, one dot row per organ. */}
      <div className="grid grid-cols-[72px_1fr] gap-3 sm:grid-cols-[96px_1fr]">
        <div />
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <button
              key={d.label}
              onClick={() => {
                setPlaying(false)
                setIdx(i)
              }}
              className={`rounded-lg py-1 text-center text-[11px] font-semibold transition ${
                i === idx ? 'bg-ink text-white' : 'text-slate-soft hover:bg-paper'
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
                    className={`flex h-7 items-center justify-center rounded-lg ${i === idx ? 'bg-paper' : ''}`}
                    title={`${shortOrgan(k)} · ${d.dateLabel} · ${sev} · ${d.organ[k]}`}
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

        <div className="flex items-center text-xs text-slate-soft">Body-stress</div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <div
              key={d.label}
              className={`flex h-7 items-center justify-center rounded-lg text-xs font-semibold ${
                i === idx ? 'bg-paper text-ink' : 'text-slate-soft'
              }`}
            >
              {d.bodyIndex}
            </div>
          ))}
        </div>
      </div>

      {/* Scrubber */}
      <div className="mt-4 grid grid-cols-[72px_1fr] items-center gap-3 sm:grid-cols-[96px_1fr]">
        <button
          onClick={playing ? () => setPlaying(false) : play}
          className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold transition hover:border-ink/40"
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

      {/* The selected day */}
      <div className="mt-6 grid gap-6 border-t border-ink/10 pt-6 md:grid-cols-[180px_1fr]">
        <div className="stage-backdrop mx-auto h-[240px] w-[180px] overflow-hidden rounded-2xl">
          <AnatomyModel organRisk={day.state.organRisk} compact />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-soft">
                {idx === last ? 'Today' : day.dateLabel}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold leading-none">{day.bodyIndex}</span>
                <span className="text-xs text-slate-soft">body-stress · of 100</span>
              </div>
            </div>
            <span className="text-xs text-slate-soft">
              {day.state.flags.length} flag{day.state.flags.length === 1 ? '' : 's'}
            </span>
          </div>

          <dl className="mt-5 space-y-3">
            <Row label="Caffeine" value={`${fmt(day.caffeine)} mg`} pct={Math.min(100, (day.caffeine / 1400) * 100)} severity={day.caffeine >= 400 ? 'caution' : 'calm'} note="~400 mg/day line" />
            <Row label="Paracetamol" value={`${fmt(day.paracetamol)} mg`} pct={(day.paracetamol / 4000) * 100} severity={day.paracetamol >= 3000 ? 'caution' : day.paracetamol > 0 ? 'watch' : 'calm'} note="ceiling 4,000 mg" />
          </dl>

          <div className="mt-5">
            <div className="text-xs font-semibold text-slate-soft">Flags on this day</div>
            {day.state.flags.length ? (
              <ul className="mt-2 space-y-1.5">
                {day.state.flags.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: RISK[f.severity].hex }} />
                    <span className="font-semibold">{shortOrgan(f.organ)}</span>
                    <span className="text-slate-soft">— {f.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-soft">None. Everything logged sits inside the usual lines.</p>
            )}
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
