/** "Twinstate" in the brand style: gradient "Twin", ink "state". One definition for every surface. */
export default function Wordmark({ className = '' }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      <span className="bg-[linear-gradient(90deg,#3A66D8,#8B5CF6)] bg-clip-text text-transparent">Twin</span>
      <span className="text-ink">state</span>
    </span>
  )
}
