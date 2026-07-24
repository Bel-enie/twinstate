import { Link } from 'react-router-dom'

/**
 * One button language across the product: `primary` is the same specular
 * treatment as the landing page CTA (.btn-specular in index.css) — a deep navy
 * face that separates from any background by VALUE, not hue — and `ghost` is
 * the same pearl surface as .btn-glass. The app and the marketing site used to
 * ship visibly different buttons; they now share these.
 */
const VARIANTS = {
  primary: 'btn-specular',
  ghost: 'btn-glass',
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
  const cls = `inline-flex items-center justify-center gap-2 rounded-[16px] font-semibold transition-all duration-150 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`

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
