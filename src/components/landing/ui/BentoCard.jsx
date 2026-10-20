import { cn } from '../../../lib/cn.js'

/**
 * The bento system. Each card is a 1px gradient shell around a solid surface:
 * quiet at rest, vivid on hover. `dark` flips the inner surface to the deep
 * holographic ground the 3D twin glows on.
 */
export function BentoGrid({ className, children }) {
  return <div className={cn('grid gap-4 sm:gap-5 lg:grid-cols-3', className)}>{children}</div>
}

export function BentoCard({ className, innerClassName, dark = false, children }) {
  return (
    <div
      className={cn(
        'group rounded-[26px] p-px transition duration-300',
        'bg-[linear-gradient(140deg,rgba(58,102,216,0.28),rgba(124,92,240,0.16)_40%,rgba(217,70,126,0.22))]',
        'hover:bg-[linear-gradient(140deg,rgba(58,102,216,0.75),rgba(124,92,240,0.6)_40%,rgba(217,70,126,0.7))]',
        'hover:shadow-[0_18px_60px_-18px_rgba(124,92,240,0.45)]',
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-[25px] p-5 sm:p-6',
          dark ? 'bg-deep text-frost' : 'bg-white/95 text-ink',
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
