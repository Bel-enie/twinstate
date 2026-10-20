import { useState } from 'react'
import { BookOpen, Thermometer, Pill } from 'lucide-react'
import SectionHeading from './ui/SectionHeading.jsx'
import Reveal from './ui/Reveal.jsx'

/**
 * Three image cards, one per real-world week the twin is built for.
 * Images live in public/landing/ (moment-1.jpg … moment-3.jpg, 4:5 portrait).
 * Until a file exists, the card shows a gradient placeholder in the same
 * palette instead of a broken image.
 */
const MOMENTS = [
  {
    src: '/landing/moment-1.jpg',
    alt: 'A student studying late at night at a desk with energy drink cans and a coffee mug',
    icon: BookOpen,
    tag: 'Exam week',
    title: 'Three energy drinks and a coffee',
    text: 'Caffeine stacks across cans, cups and "stay awake" tablets. The twin adds it up and lights the heart before you cross the line.',
    placeholder: 'from-brand-500 via-violet-500 to-fuchsia-500',
  },
  {
    src: '/landing/moment-2.jpg',
    alt: 'A student resting in bed with a cold, painkillers and a glass of water on the nightstand',
    icon: Thermometer,
    tag: 'The sick day',
    title: 'Two painkillers that are secretly one',
    text: 'Cold remedies hide paracetamol and ibuprofen hides in "extra strength" packs. The twin catches the double dose your stomach and liver would feel.',
    placeholder: 'from-violet-500 via-fuchsia-500 to-rose-400',
  },
  {
    src: '/landing/moment-3.jpg',
    alt: 'A student at home comparing a prescription bottle with herbal supplement bottles',
    icon: Pill,
    tag: 'New prescription',
    title: 'A prescription meets a "natural" tonic',
    text: 'Herbal doesn\'t mean harmless. The twin screens your prescription against every supplement and tonic you already take.',
    placeholder: 'from-rose-400 via-violet-500 to-brand-500',
  },
]

function MomentCard({ m }) {
  const [failed, setFailed] = useState(false)
  const Icon = m.icon

  return (
    <article className="group h-full overflow-hidden rounded-[26px] bg-[linear-gradient(140deg,rgba(58,102,216,0.28),rgba(124,92,240,0.16)_40%,rgba(217,70,126,0.22))] p-px transition duration-300 hover:bg-[linear-gradient(140deg,rgba(58,102,216,0.75),rgba(124,92,240,0.6)_40%,rgba(217,70,126,0.7))] hover:shadow-[0_18px_60px_-18px_rgba(124,92,240,0.45)]">
      <div className="flex h-full flex-col overflow-hidden rounded-[25px] bg-white">
        <div className="relative aspect-[4/5] overflow-hidden">
          {failed ? (
            <div
              className={`grid h-full w-full place-items-center bg-gradient-to-br ${m.placeholder}`}
              role="img"
              aria-label={m.alt}
            >
              <Icon className="h-14 w-14 text-white/80" aria-hidden="true" />
            </div>
          ) : (
            <img
              src={m.src}
              alt={m.alt}
              loading="lazy"
              decoding="async"
              width="800"
              height="1000"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink shadow-card backdrop-blur">
            <Icon className="h-3.5 w-3.5 text-violet-600" aria-hidden="true" />
            {m.tag}
          </span>
        </div>
        <div className="flex-1 p-5 sm:p-6">
          <h3 className="text-balance font-display text-xl font-extrabold tracking-[-0.02em]">{m.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-soft">{m.text}</p>
        </div>
      </div>
    </article>
  )
}

export default function Moments() {
  return (
    <section id="moments" className="mx-auto max-w-[1200px] scroll-mt-24 px-5 py-20 sm:px-8">
      <SectionHeading
        eyebrow="Built for real weeks"
        title="The risky part is"
        gradientWord="the combination."
        sub="Nobody plans a dangerous mix. It builds up across an ordinary week — and that's exactly what the twin watches."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {MOMENTS.map((m, i) => (
          <Reveal key={m.src} delay={i * 0.08} className="h-full">
            <MomentCard m={m} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
