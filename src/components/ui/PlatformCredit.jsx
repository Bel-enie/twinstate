import { hasHolon, hasAIChat } from '../../services/index.js'

/**
 * "Built on Ontomorph" strip — signposts exactly which platform pillars this
 * app uses, so the "Use of the platform" judging criterion is visible during
 * the live demo. Honest: HOLON reflects whether a real clinical key is active.
 */
const PILLARS = [
  { label: 'Digital twin', on: true },
  { label: '3D anatomy', on: true },
  {
    label: hasHolon ? 'HOLON drug database' : 'Built-in interaction rules',
    on: true,
    title: hasHolon
      ? 'HOLON is Ontomorph’s clinical drug-interaction database. Your substances are checked against it.'
      : 'HOLON (Ontomorph’s clinical drug-interaction database) is not switched on, so Twinstate’s own rules are used.',
  },
  { label: hasAIChat ? 'AI explanations on' : 'AI explanations off', on: hasAIChat },
]

export default function PlatformCredit({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-soft">
        Built on Ontomorph
      </span>
      {PILLARS.map((p) => (
        <span
          key={p.label}
          title={p.title}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            p.on
              ? 'border-violet-100 bg-violet-50 text-violet-700'
              : 'border-ink/10 bg-cream text-slate-soft'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${p.on ? 'bg-violet-500' : 'bg-slate-soft/40'}`}
          />
          {p.label}
        </span>
      ))}
    </div>
  )
}
