import AnimatedGradientText from './AnimatedGradientText.jsx'

/**
 * The shell for each sticky story card: a gradient hairline around an opaque
 * white surface (opaque so a covered card never shows through), a numbered
 * eyebrow, and a display-face title with an optional gradient tail.
 */
export default function StoryCard({ n, eyebrow, title, gradient, sub, children }) {
  return (
    <article className="rounded-[30px] bg-[linear-gradient(140deg,rgba(58,102,216,0.45),rgba(124,92,240,0.3)_40%,rgba(217,70,126,0.4))] p-px shadow-[0_30px_80px_-40px_rgba(76,58,160,0.55)]">
      <div className="rounded-[29px] bg-white p-6 sm:p-9">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-grad text-xs font-extrabold text-white">
            {String(n).padStart(2, '0')}
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">{eyebrow}</span>
        </div>
        <h2 className="mt-4 max-w-3xl text-balance font-display text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">
          {title} {gradient && <AnimatedGradientText>{gradient}</AnimatedGradientText>}
        </h2>
        {sub && <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-soft">{sub}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </article>
  )
}
