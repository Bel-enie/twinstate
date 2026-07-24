/**
 * A titled panel: an uppercase mono eyebrow and a title in a header block,
 * closed by a hairline, then the body. This is the dashboard's main rhythm —
 * every major region announces what it is in the same way and at the same
 * edge, so the page reads as one organised grid rather than as a pile of
 * separately-styled cards.
 */
export default function Panel({
  eyebrow,
  title,
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
            <div className="min-w-0">
              {eyebrow && <p className="panel-eyebrow">{eyebrow}</p>}
              {title && (
                <h2 className="mt-1.5 text-[17px] font-bold leading-tight tracking-tight text-ink">
                  {title}
                </h2>
              )}
              {sub && <p className="mt-1 text-[13px] leading-relaxed text-slate-soft">{sub}</p>}
            </div>
            {aside && <div className="shrink-0">{aside}</div>}
          </div>
        </div>
      )}
      <div className={`panel-body ${bodyClassName}`}>{children}</div>
    </div>
  )
}
