import { cn } from '../../../lib/cn.js'

/** Magic UI-style panning gradient text. Static gradient under reduced motion. */
export default function AnimatedGradientText({ className, children }) {
  return (
    <span
      className={cn(
        'bg-[linear-gradient(90deg,#3A66D8,#8B5CF6,#E0567A,#8B5CF6,#3A66D8)] bg-[length:220%_auto] bg-clip-text text-transparent motion-safe:animate-gradient-x',
        className
      )}
    >
      {children}
    </span>
  )
}
