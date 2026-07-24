/**
 * The app's standard surface. Uses the same pearl material as the landing
 * page's product cards (.card-pearl in index.css) so a card looks the same
 * whichever half of the product it is in.
 */
export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`card-pearl rounded-[22px] ${className}`} {...props}>
      {children}
    </div>
  )
}
