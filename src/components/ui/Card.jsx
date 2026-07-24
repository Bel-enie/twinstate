/**
 * The app's standard surface: a flat white plane separated from the ground by
 * a hairline, cornered at the single shared radius (--panel-r in index.css).
 * Previously this was a pearl gradient with a drop shadow at its own 22px
 * radius, which made every surface sit at a slightly different edge from its
 * neighbours. Structure separates panels now, not shadow.
 */
export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`panel ${className}`} {...props}>
      {children}
    </div>
  )
}
