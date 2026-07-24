import { useMemo } from 'react'
import AppShell from '../components/layout/AppShell.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import RiskBadge from '../components/ui/RiskBadge.jsx'
import StatCard from '../components/charts/StatCard.jsx'
import TrendArea from '../components/charts/TrendArea.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { scaledBodyTrend } from '../services/mock/engine.js'
import { SUBSTANCE_BY_ID } from '../services/mock/mockData.js'
import { riskOf } from '../utils/risk.js'
import { twinNaming } from '../utils/naming.js'

export default function History() {
  const { history, twin, overall, bodyIndex } = useTwin()
  const who = twinNaming(twin?.name)

  // Per-day trend, anchored so "today" equals the twin's current body-stress
  // index (the same number the dashboard shows) — they can never disagree.
  const trend = useMemo(() => scaledBodyTrend(history, bodyIndex), [history, bodyIndex])
  const current = trend.length ? trend[trend.length - 1].value : 0
  const weekAgo = trend.length ? trend[0].value : current
  const delta = current - weekAgo

  // Weekly cumulative totals per substance.
  const totals = useMemo(() => {
    const map = {}
    for (const d of history) {
      for (const it of d.items) {
        map[it.substanceId] = (map[it.substanceId] || 0) + (it.times || 1)
      }
    }
    return Object.entries(map)
      .map(([id, count]) => ({ id, count, label: SUBSTANCE_BY_ID[id]?.label.split(' (')[0] || id }))
      .sort((a, b) => b.count - a.count)
  }, [history])

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">{who.Possessive} last 7 days</h1>
        <p className="text-sm text-slate-soft">
          Risk isn't one dose — it's the pattern. Here's how {who.possessive} intake has built up.
        </p>
      </div>

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

      {/* Weekly totals */}
      <Card className="mb-5 p-5">
        <h2 className="text-sm font-bold text-slate-soft">This week, totalled up</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {totals.map((t) => (
            <span key={t.id} className="rounded-full bg-shell px-3 py-1.5 text-sm font-semibold">
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
