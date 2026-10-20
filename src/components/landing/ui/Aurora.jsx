/**
 * The page's background: three drifting gradient glows plus a faint dot grid.
 * Pure CSS — this replaces the old WebGL Atmosphere shader (no GL contexts,
 * no per-frame canvas work, nothing to leak). Blobs hold still under
 * prefers-reduced-motion.
 */
export default function Aurora() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-56 left-1/2 h-[620px] w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(75,132,240,0.26),transparent_70%)] blur-3xl motion-safe:animate-aurora" />
      <div className="absolute -left-48 top-[26%] h-[480px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.2),transparent_70%)] blur-3xl motion-safe:animate-aurora [animation-delay:-5s]" />
      <div className="absolute -right-48 top-[58%] h-[460px] w-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(224,86,122,0.16),transparent_70%)] blur-3xl motion-safe:animate-aurora [animation-delay:-10s]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(31,36,48,0.08)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(180deg,black,transparent_75%)]" />
    </div>
  )
}
