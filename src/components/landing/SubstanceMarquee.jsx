import Marquee from './ui/Marquee.jsx'
import { SUBSTANCES } from '../../services/mock/mockData.js'
import { CATEGORY_LABEL } from '../../utils/risk.js'

const CAT_TONE = {
  prescription: 'border-brand-200 bg-brand-50 text-brand-700',
  otc: 'border-violet-200 bg-violet-50 text-violet-700',
  energy_drink: 'border-rose-200 bg-rose-50 text-rose-700',
  supplement: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  herbal: 'border-amber-200 bg-amber-50 text-amber-700',
}

function Chip({ s }) {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
        CAT_TONE[s.category] || 'border-ink/10 bg-white text-ink'
      }`}
    >
      {s.label.split(' (')[0]}
      <span className="font-normal opacity-70">{CATEGORY_LABEL[s.category] || s.category}</span>
    </span>
  )
}

/** Two counter-scrolling rows of everything the catalog screens. */
export default function SubstanceMarquee() {
  const half = Math.ceil(SUBSTANCES.length / 2)
  return (
    <section aria-label="Substances Twinstate screens" className="mx-auto max-w-[1200px] px-5 pb-6 sm:px-8">
      <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-soft">
        Screens {SUBSTANCES.length} substances — and every combination of them
      </p>
      <div className="space-y-3">
        <Marquee duration="46s">
          {SUBSTANCES.slice(0, half).map((s) => (
            <Chip key={s.id} s={s} />
          ))}
        </Marquee>
        <Marquee reverse duration="52s">
          {SUBSTANCES.slice(half).map((s) => (
            <Chip key={s.id} s={s} />
          ))}
        </Marquee>
      </div>
    </section>
  )
}
