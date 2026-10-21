/**
 * The page's opening line, dashboard-style: a big display-face title with a
 * one-line sub, and a row of chips / actions on the right.
 */
export default function PageHeader({ title, sub, actions, className = '' }) {
  return (
    <div className={`mb-6 flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-[32px] font-extrabold leading-tight sm:text-[36px]">{title}</h1>
        {sub && <p className="mt-1.5 text-sm leading-relaxed text-slate-soft sm:text-base">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** A rounded white chip with an optional leading icon, for the header's control row. */
export function Chip({ icon: Icon, children, className = '', ...props }) {
  const Tag = props.to || props.href ? 'a' : 'span'
  return (
    <Tag
      className={`inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card ${className}`}
      {...props}
    >
      {Icon && (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-50 text-violet-600">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
      {children}
    </Tag>
  )
}
