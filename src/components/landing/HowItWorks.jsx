import { ClipboardList, ScanSearch, TrendingUp } from 'lucide-react'
import { BentoGrid, BentoCard } from './ui/BentoCard.jsx'
import SectionHeading from './ui/SectionHeading.jsx'
import Reveal from './ui/Reveal.jsx'

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Log it in two minutes',
    text: 'Prescriptions, painkillers, energy drinks, supplements — plus how you slept and feel. No account, just a first name.',
  },
  {
    icon: ScanSearch,
    title: 'The twin screens the mix',
    text: 'Your combination is checked against drug-interaction rules as one picture, and risk lights up on the 3D body, organ by organ.',
  },
  {
    icon: TrendingUp,
    title: 'See the week, ask what if',
    text: 'Track the pattern over days, simulate "keep this up" against "ease off", and get one plain-language next step.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1200px] scroll-mt-24 px-5 py-20 sm:px-8">
      <SectionHeading
        eyebrow="How it works"
        title="From scattered doses to"
        gradientWord="one decision."
        sub="Three steps, no pharmacology exam. Everything is explained like a knowledgeable friend."
      />
      <Reveal delay={0.1} className="mt-12">
        <BentoGrid>
          {STEPS.map((s, i) => (
            <BentoCard key={s.title}>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#3A66D8,#8B5CF6,#D9467E)] text-white shadow-glow">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="bg-[linear-gradient(90deg,#3A66D8,#8B5CF6)] bg-clip-text text-3xl font-extrabold text-transparent">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-soft">{s.text}</p>
            </BentoCard>
          ))}
        </BentoGrid>
      </Reveal>
    </section>
  )
}
