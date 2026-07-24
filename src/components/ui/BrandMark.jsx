/**
 * Twinstate logo mark — a gradient human figure overlaid with a connected
 * node-network ("digital twin"). Pure inline SVG so it stays crisp from the
 * 16px footer up to the hero header, with no image asset to ship.
 *
 * `size` sets the rounded card; the figure scales to fill it. Each instance
 * gets a unique gradient id so multiple marks on a page never clash.
 */
let uid = 0

export default function BrandMark({ className = 'h-8 w-8' }) {
  const gid = `twinGrad-${(uid += 1)}`
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-white shadow-soft ring-1 ring-ink/5 ${className}`}
    >
      <svg viewBox="0 0 48 48" className="h-[72%] w-[72%]" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4B84F0" />
            <stop offset="1" stopColor="#3FB8A0" />
          </linearGradient>
        </defs>

        {/* Figure: head + upper body silhouette */}
        <circle cx="24" cy="11" r="5" fill={`url(#${gid})`} />
        <path
          d="M24 17c6 0 10.5 4.2 11.6 11l1.1 11.4c.2 2-1 3.1-3 3.1H14.3c-2 0-3.2-1.1-3-3.1L12.4 28C13.5 21.2 18 17 24 17Z"
          fill={`url(#${gid})`}
        />

        {/* Network overlay */}
        <g stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity="0.9">
          <path d="M24 22 19 28M24 22 29 28M19 28 24 34M29 28 24 34M19 28 29 28" />
        </g>
        <g fill="#fff">
          <circle cx="24" cy="22" r="1.7" />
          <circle cx="19" cy="28" r="1.7" />
          <circle cx="29" cy="28" r="1.7" />
          <circle cx="24" cy="34" r="1.7" />
        </g>
      </svg>
    </span>
  )
}
