import { useMemo, useState } from 'react'
import AppShell from '../components/layout/AppShell.jsx'
import Card from '../components/ui/Card.jsx'
import Panel from '../components/ui/Panel.jsx'
import Button from '../components/ui/Button.jsx'
import PageHeader, { Chip } from '../components/ui/PageHeader.jsx'
import { CalendarDays } from 'lucide-react'
import StatCard from '../components/charts/StatCard.jsx'
import TrendArea from '../components/charts/TrendArea.jsx'
import WeekGrid, { useWeekPlayer } from '../components/charts/WeekGrid.jsx'
import Twin3D from '../components/twin3d/index.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { scaledBodyTrend } from '../services/mock/engine.js'
import { SUBSTANCE_BY_ID } from '../services/mock/mockData.js'
import { RISK, riskOf } from '../utils/risk.js'
import { twinNaming } from '../utils/naming.js'
import { buildDays, LOAD_LABEL, shortOrgan } from '../components/landing/twinData.js'

const prettyId = (id) => id.replace(/^(custom|holon)-/, '').replace(/[-_]+/g, ' ')

export default function History() {
  const { history, twin, overall, bodyIndex } = useTwin()
  const who = twinNaming(twin?.name)

  // Per-day trend, anchored so "today" equals the twin's current body-stress
  // index (the same number the dashboard shows) — they can never disagree.
  const trend = useMemo(() => scaledBodyTrend(history, bodyIndex), [history, bodyIndex])
  const current = trend.length ? trend[trend.length - 1].value : 0
  const weekAgo = trend.length ? trend[0].value : current
  const delta = current - weekAgo

  // The same day-by-day engine run the landing page shows: organ severities,
  // load and flags for each day, scrubbable, with the twin drawn for that day.
  const days = useMemo(() => buildDays(history || []), [history])
  const { idx, last, playing, toggle, pick, day } = useWeekPlayer(days)
  const [organ, setOrgan] = useState(null)

  // Weekly cumulative totals per substance (custom substances keep their label).
  const totals = useMemo(() => {
    const map = {}
    for (const d of history) {
      for (const it of d.items) {
        const label =
          SUBSTANCE_BY_ID[it.substanceId]?.label.split(' (')[0] ||
          it.def?.label?.split(' (')[0] ||
          prettyId(it.substanceId)
        map[it.substanceId] = { count: (map[it.substanceId]?.count || 0) + (it.times || 1), label }
      }
    }
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
  }, [history])

  return (
    <AppShell>
      <PageHeader
        title={`${who.Possessive} last 7 days`}
        sub={`Risk isn't one dose — it's the pattern. Here's how ${who.possessive} intake has built up.`}
        actions={<Chip icon={CalendarDays}>{days.length ? `${days[0].dateLabel} – ${days[days.length - 1].dateLabel}` : 'This week'}</Chip>}
      />

      {/* Body-stress trend */}
      <StatCard
        className="mb-5"
        label="Body-stress index this week"
        value={current}
        unit="/100"
        delta={delta}
        footer={
          delta > 0
            ? 'Trending up — the pattern is adding load. Small changes now pay off.'
            : delta < 0
              ? 'Trending down — recovery is working. Keep it up.'
              : 'Holding steady over the week.'
        }
      >
        <TrendArea data={trend} color={riskOf(overall).hex} suffix="/100" />
      </StatCard>

      {/* Day by day */}
      {days.length > 0 && day && (
        <Panel
          className="mb-5"
          icon={CalendarDays}
          title="How the week built up"
          sub="Play or drag through the week. The body, the organ grid and the flags are recomputed for each day."
        >
          <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
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
              <WeekGrid days={days} idx={idx} playing={playing} onPick={pick} onToggle={toggle} name={who.possessive} />

              <div className="mt-5 border-t border-[color:var(--panel-line)] pt-4" aria-live="polite">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold leading-none tracking-[-0.03em]">{day.bodyIndex}</span>
                    <span className="text-xs text-slate-soft">{LOAD_LABEL.toLowerCase()} · of 100</span>
                  </div>
                  <span className="text-xs font-semibold">
                    {day.state.flags.length} flag{day.state.flags.length === 1 ? '' : 's'}
                  </span>
                </div>
                {day.state.flags.length ? (
                  <ul className="mt-3 space-y-1.5">
                    {day.state.flags.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: RISK[f.severity].hex }} aria-hidden="true" />
                        <span className="font-semibold">{shortOrgan(f.organ)}</span>
                        <span className="min-w-0 truncate text-slate-soft">— {f.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-soft">No flags on this day.</p>
                )}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Weekly totals */}
      <Card className="mb-5 p-5">
        <h2 className="text-sm font-bold text-slate-soft">This week, totalled up</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {totals.map((t) => (
            <span key={t.id} className="rounded-full bg-paper px-3 py-1.5 text-sm font-semibold">
              {t.count}× {t.label}
            </span>
          ))}
        </div>
      </Card>

      <div className="mt-5 flex gap-2">
        <Button to="/what-if">
          Where does this lead? →
        </Button>
        <Button to="/dashboard" variant="ghost">
          Back to twin
        </Button>
      </div>
    </AppShell>
  )
}
