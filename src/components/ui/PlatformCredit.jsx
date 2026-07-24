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
    label: hasHolon ? 'HOLON drug interactions' : 'HOLON-ready interactions',
    on: hasHolon,
  },
  { label: 'AI reasoning', on: hasAIChat },
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
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            p.on
              ? 'border-brand-100 bg-brand-50 text-brand-700'
              : 'border-ink/10 bg-cream text-slate-soft'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${p.on ? 'bg-brand-500' : 'bg-slate-soft/40'}`}
          />
          {p.label}
        </span>
      ))}
    </div>
  )
}
