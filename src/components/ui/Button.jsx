import { Link } from 'react-router-dom'

/**
 * One button language across the product, in two registers. In the app,
 * `primary`/`ghost` are flat solid fills that sit on white panels with the
 * same hairline as the panels themselves. On the landing page, `specular`/
 * `glass` keep the haloed treatment, which is what separates a control from
 * the WebGL ribbon field behind it.
 */
const VARIANTS = {
  primary: 'btn-solid',
  ghost: 'btn-outline',
  // The landing page keeps the specular pair: it has to separate from the
  // WebGL ribbon field, which a flat fill cannot do.
  specular: 'btn-specular',
  glass: 'btn-glass',
  soft: 'bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100 active:scale-[0.98]',
  dark: 'bg-ink text-white shadow-soft hover:bg-ink/90 active:scale-[0.98]',
}

const SIZES = {
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-4 text-base',
  sm: 'px-3.5 py-2 text-sm',
}

export default function Button({
  as = 'button',
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all duration-150 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    )
  }
  const Tag = as
  return (
    <Tag className={cls} {...props}>
      {children}
    </Tag>
  )
}
