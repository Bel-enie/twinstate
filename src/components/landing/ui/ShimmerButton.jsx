import { cn } from '../../../lib/cn.js'

/**
 * The primary gradient CTA (Magic UI shimmer-button pattern): a panning
 * three-stop gradient with a soft colored shadow. Defaults to type="button"
 * so it never submits a form by accident; pass type="submit" explicitly.
 */
export default function ShimmerButton({ className, children, type = 'button', ...props }) {
  return (
    <button
      type={type}
      {...props}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white',
        'bg-[linear-gradient(110deg,#3A66D8,#7C5CF0,#D9467E,#7C5CF0,#3A66D8)] bg-[length:220%_100%]',
        'shadow-[0_10px_32px_-10px_rgba(124,92,240,0.65)] transition',
        'hover:shadow-[0_14px_44px_-10px_rgba(124,92,240,0.8)] hover:brightness-105',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500',
        'active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60',
        'motion-safe:animate-gradient-x',
        className
      )}
    >
      {children}
    </button>
  )
}
