import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ClipboardList, Pill, Zap, Leaf, FlaskConical, Moon } from 'lucide-react'
import StoryCard from '../ui/StoryCard.jsx'
import BrandMark from '../../ui/BrandMark.jsx'
import Wordmark from '../../ui/Wordmark.jsx'

const INPUTS = [
  { label: 'Prescriptions', icon: ClipboardList },
  { label: 'Painkillers', icon: Pill },
  { label: 'Energy drinks', icon: Zap },
  { label: 'Supplements', icon: FlaskConical },
  { label: 'Herbal tonics', icon: Leaf },
  { label: 'Symptoms & sleep', icon: Moon },
]

/** Six scattered sources flowing into one model — with data streaming along the lines. */
function Fusion() {
  const reduce = useReducedMotion()
  const gid = `fuse-${useId().replace(/:/g, '')}`
  const W = 220
  const H = 330
  const ys = INPUTS.map((_, i) => 27 + (i * (H - 54)) / (INPUTS.length - 1))

  return (
    <div className="grid items-center gap-5 md:grid-cols-[minmax(0,230px)_220px_auto] md:gap-0">
      <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-1">
        {INPUTS.map(({ label, icon: Icon }) => (
          <li
            key={label}
            className="flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-paper/70 px-3.5 py-2.5 text-sm font-semibold"
          >
            <Icon className="h-4 w-4 shrink-0 text-violet-500" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>

      <svg viewBox={`0 0 ${W} ${H}`} className="hidden h-[330px] w-[220px] md:block" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" x2={W} y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3A66D8" />
            <stop offset="0.6" stopColor="#7C5CF0" />
            <stop offset="1" stopColor="#D9467E" />
          </linearGradient>
        </defs>
        {ys.map((y, i) => (
          <motion.path
            key={i}
            d={`M0 ${y} C ${W * 0.45} ${y}, ${W * 0.55} ${H / 2}, ${W} ${H / 2}`}
            fill="none"
            stroke={`url(#${gid})`}
            strokeOpacity="0.7"
            strokeWidth="1.75"
            strokeDasharray="5 7"
            animate={reduce ? undefined : { strokeDashoffset: [0, -24] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        <circle cx={W - 3} cy={H / 2} r="4" fill="#D9467E" />
      </svg>

      <div className="flex items-center gap-3 justify-self-start rounded-3xl border border-violet-200 bg-white px-5 py-4 shadow-[0_14px_40px_-18px_rgba(124,92,240,0.6)] md:ml-1">
        <BrandMark className="h-11 w-11" />
        <div>
          <Wordmark className="text-lg" />
          <div className="text-xs text-slate-soft">everything you take, checked together</div>
        </div>
      </div>
    </div>
  )
}

export default function ProblemCard() {
  return (
    <StoryCard
      n={1}
      eyebrow="The problem"
      title="Your health data is fragmented."
      gradient="Your body isn't."
      sub="Everything a student takes lives somewhere different — a prescription, a pharmacy receipt, a fridge, a memory. Twinstate puts it on one timeline and checks how it adds up across your week."
    >
      <div className="grid gap-4 border-y border-ink/10 py-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-soft">Health apps</p>
          <p className="mt-1.5 font-display text-xl font-bold tracking-[-0.02em] sm:text-2xl">Show you your data.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Twinstate</p>
          <p className="mt-1.5 font-display text-xl font-bold tracking-[-0.02em] sm:text-2xl">
            Checks it <em>together</em>, as one picture.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <Fusion />
      </div>
    </StoryCard>
  )
}
