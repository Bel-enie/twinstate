export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-3xl bg-white shadow-soft border border-ink/5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
