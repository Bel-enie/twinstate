import { Link } from 'react-router-dom'

const VARIANTS = {
  primary:
    'bg-brand-grad text-white shadow-soft hover:shadow-glow hover:brightness-105 active:scale-[0.98]',
  ghost: 'bg-white/70 text-ink border border-ink/10 hover:bg-white active:scale-[0.98]',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:scale-[0.98]',
  dark: 'bg-ink text-white hover:bg-ink/90 active:scale-[0.98]',
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
  const cls = `inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`

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
