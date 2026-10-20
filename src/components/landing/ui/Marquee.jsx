import { cn } from '../../../lib/cn.js'

/**
 * Magic UI-style marquee: the content is rendered twice and slides by exactly
 * one copy's width, so the loop is seamless. The whole row pauses while
 * hovered (both copies together, so they never desync). The second copy is
 * aria-hidden so screen readers hear the list once.
 */
export default function Marquee({ children, reverse = false, duration = '42s', className }) {
  return (
    <div
      className={cn(
        'group flex overflow-hidden [--gap:0.75rem]',
        '[mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]',
        className
      )}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          style={{ '--duration': duration }}
          className={cn(
            'flex w-max shrink-0 animate-marquee items-center gap-[--gap] pr-[--gap] group-hover:[animation-play-state:paused]',
            reverse && '[animation-direction:reverse]'
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
