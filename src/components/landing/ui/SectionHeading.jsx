import AnimatedGradientText from './AnimatedGradientText.jsx'
import Reveal from './Reveal.jsx'

export default function SectionHeading({ eyebrow, title, gradientWord, sub }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">{eyebrow}</p>
      )}
      <h2 className="mt-3 text-balance font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
        {title} {gradientWord && <AnimatedGradientText>{gradientWord}</AnimatedGradientText>}
      </h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-slate-soft sm:text-lg">{sub}</p>}
    </Reveal>
  )
}
