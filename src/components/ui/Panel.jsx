import { Info } from 'lucide-react'

/**
 * A titled card: an optional icon tile, the title (with an optional info
 * hint), a sub line, and controls on the right, closed by a hairline, then
 * the body. Every major region on every screen announces itself this way,
 * so the app reads as one organised grid rather than a pile of cards.
 */
export default function Panel({
  icon: Icon,
  eyebrow,
  title,
  info,
  sub,
  aside,
  className = '',
  bodyClassName = '',
  children,
  ...props
}) {
  return (
    <div className={`panel flex flex-col ${className}`} {...props}>
      {(eyebrow || title || aside) && (
        <div className="panel-head">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {Icon && (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                {eyebrow && <p className="panel-eyebrow">{eyebrow}</p>}
                {title && (
                  <h2 className="mt-0.5 flex items-center gap-1.5 text-[17px] font-bold leading-tight tracking-tight text-ink">
                    {title}
                    {info && (
                      <span title={info} className="text-slate-soft/70">
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only">{info}</span>
                      </span>
                    )}
                  </h2>
                )}
                {sub && <p className="mt-1 text-[13px] leading-relaxed text-slate-soft">{sub}</p>}
              </div>
            </div>
            {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
          </div>
        </div>
      )}
      <div className={`panel-body ${bodyClassName}`}>{children}</div>
    </div>
  )
}
