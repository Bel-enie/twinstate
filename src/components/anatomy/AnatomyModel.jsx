import { useEffect, useId, useMemo, useRef } from 'react'
import { riskOf } from '../../utils/risk.js'

/**
 * Twinstate 3D anatomy — a rotatable, volumetric "holographic body scan".
 *
 * Pure CSS 3D transforms + SVG (no WebGL / no extra deps) so it's rock-solid for
 * a live demo. The human silhouette is EXTRUDED across many depth slices to form
 * a real translucent volume that turns like a solid object, wrapped in a fine
 * wireframe skin, with anatomically-placed organs that glow, a heart that beats,
 * a breathing chest, a sweeping scan beam, rising data motes and a hologram base.
 * Driven by the same organ-risk map the Ontomorph DTP twin state returns.
 *
 * Props: organRisk { [key]: { severity, flagCount, intensity? } }, selected, onSelect, compact, callouts, scale
 */

// ── Organ layout ──────────────────────────────────────────────────────────
// `anchor` = % of the 240×480 body box (for callout pills + hit ring).
// `path`   = anatomical silhouette drawn in that same 240×480 user space.
const ORGANS = {
  brain: {
    label: 'Brain',
    side: 'right',
    anchor: { x: 50, y: 7.5 },
    z: 2,
    beat: false,
    path:
      'M110,32 C106,23 118,19 121,27 C124,19 136,23 131,33 C138,37 132,48 124,45 C122,50 118,50 116,45 C108,48 103,38 110,32 Z',
  },
  heart: {
    label: 'Heart',
    side: 'left',
    anchor: { x: 45, y: 31 },
    z: 8,
    beat: true,
    path:
      'M108,141 C103,133 90,135 90,146 C90,158 108,168 108,168 C108,168 126,158 126,146 C126,135 113,133 108,141 Z',
  },
  liver: {
    label: 'Liver',
    side: 'right',
    anchor: { x: 58, y: 34 },
    z: 7,
    beat: false,
    path:
      'M119,151 C133,147 153,150 157,158 C160,165 151,173 139,173 C129,173 121,167 119,159 C118,155 117,153 119,151 Z',
  },
  stomach: {
    label: 'Stomach',
    side: 'left',
    anchor: { x: 44, y: 37 },
    z: 6,
    beat: false,
    path:
      'M112,159 C103,158 95,166 98,177 C101,188 114,188 117,180 C119,175 116,169 113,170 C114,164 117,161 112,159 Z',
  },
  kidneys: {
    label: 'Kidneys',
    side: 'right',
    anchor: { x: 50, y: 43 },
    z: -6,
    beat: false,
    lobes: true,
    path:
      'M103,197 C97,196 93,202 95,209 C97,216 104,216 106,210 C103,208 103,201 105,199 C105,197 104,197 103,197 Z ' +
      'M137,197 C143,196 147,202 145,209 C143,216 136,216 134,210 C137,208 137,201 135,199 C135,197 136,197 137,197 Z',
  },
}

// Depth extrusion — the loaf of translucent slices that gives the body real mass.
const SLICES = 14
const DEPTH = 30 // total px front-to-back
const FRONT_Z = DEPTH / 2 + 3
const BACK_Z = -DEPTH / 2 - 3

const SEV_RANK = { calm: 0, watch: 1, caution: 2, urgent: 3 }

function intensityFor(entry) {
  if (!entry) return 0
  if (typeof entry.intensity === 'number') return Math.max(0, Math.min(100, entry.intensity))
  return { calm: 18, watch: 48, caution: 72, urgent: 92 }[entry.severity] || 18
}

// Raw body geometry — reused for slices, mesh, clip-path and the glowing edge.
function BodyShapes() {
  return (
    <>
      {/* head */}
      <ellipse cx="120" cy="42" rx="23" ry="27" />
      {/* neck */}
      <path d="M110,64 L130,64 L133,86 L107,86 Z" />
      {/* torso: shoulders → chest → waist → hips */}
      <path d="M104,80 C95,81 84,86 80,104 C77,122 84,152 88,182 C90,202 87,216 96,236 C101,252 97,270 109,285 L131,285 C143,270 139,252 144,236 C153,216 150,202 152,182 C156,152 163,122 160,104 C156,86 145,81 136,80 Z" />
      {/* left arm */}
      <path d="M80,104 C69,109 61,132 59,162 C57,192 59,222 66,250 C67,256 74,256 76,250 C72,222 71,192 75,164 C79,138 87,118 91,107 Z" />
      {/* right arm */}
      <path d="M160,104 C171,109 179,132 181,162 C183,192 181,222 174,250 C173,256 166,256 164,250 C168,222 169,192 165,164 C161,138 153,118 149,107 Z" />
      {/* left leg */}
      <path d="M100,284 C93,320 90,372 95,424 C96,443 100,458 106,458 C112,458 114,443 114,424 C117,372 118,330 118,286 Z" />
      {/* right leg */}
      <path d="M140,284 C147,320 150,372 145,424 C144,443 140,458 134,458 C128,458 126,443 126,424 C123,372 122,330 122,286 Z" />
      {/* feet */}
      <ellipse cx="103" cy="462" rx="11" ry="6" />
      <ellipse cx="137" cy="462" rx="11" ry="6" />
    </>
  )
}

// A single SVG layer that fills its viewBox; children drawn in 240×480 space.
function Layer({ children, opacity = 1, className = '', style }) {
  return (
    <svg
      viewBox="0 0 240 480"
      preserveAspectRatio="xMidYMid meet"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity, ...style }}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function OrganShape({ okey, geo, entry, isSel, onSelect, movedRef, uid }) {
  const r = riskOf(entry?.severity || 'calm')
  const intensity = intensityFor(entry)
  const flagged = (entry?.severity && entry.severity !== 'calm') || intensity > 34
  const a = geo.anchor

  const cx = (a.x / 100) * 240
  const cy = (a.y / 100) * 480

  return (
    <g
      className="cursor-pointer"
      style={{
        pointerEvents: 'auto',
        transform: `translate(${cx}px,${cy}px) scale(1.32) translate(${-cx}px,${-cy}px)`,
      }}
      onClick={() => {
        if (!movedRef.current.moved) onSelect()
      }}
    >
      {/* soft aura — prominent when flagged, whisper-subtle when calm so it
          doesn't bleed a coloured blob past the body silhouette */}
      <path
        d={geo.path}
        fill={r.hex}
        className={flagged ? 'twin-organ-pulse' : ''}
        style={{ filter: flagged ? 'blur(6px)' : 'blur(3px)', opacity: flagged ? 1 : 0.22 }}
      />
      {/* solid body */}
      <path
        d={geo.path}
        fill={`url(#organ-${uid})`}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="0.9"
        className={geo.beat ? 'twin-heartbeat' : ''}
        style={{ filter: `drop-shadow(0 0 7px ${r.hex}) drop-shadow(0 0 3px ${r.hex})`, color: r.hex }}
      />
      {isSel && (
        <circle
          cx={cx}
          cy={cy}
          r="24"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
      )}
    </g>
  )
}

export default function AnatomyModel({
  organRisk = {},
  selected = null,
  onSelect = () => {},
  compact = false,
  callouts = false,
  scale = 1,
}) {
  const uid = useId().replace(/:/g, '')
  const rigRef = useRef(null)
  const rot = useRef({ ry: 16, rx: -3, dragging: false, sx: 0, sy: 0, sry: 0, srx: 0, moved: false })

  useEffect(() => {
    let raf
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const tick = () => {
      const r = rot.current
      if (!r.dragging && !reduceMotion) r.ry += 0.11
      if (rigRef.current) {
        rigRef.current.style.setProperty('--ry', `${r.ry.toFixed(2)}deg`)
        rigRef.current.style.setProperty('--rx', `${r.rx.toFixed(2)}deg`)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onDown = (e) => {
    const r = rot.current
    r.dragging = true
    r.moved = false
    r.sx = e.clientX
    r.sy = e.clientY
    r.sry = r.ry
    r.srx = r.rx
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    const r = rot.current
    if (!r.dragging) return
    const dx = e.clientX - r.sx
    const dy = e.clientY - r.sy
    if (Math.abs(dx) + Math.abs(dy) > 4) r.moved = true
    r.ry = r.sry + dx * 0.4
    r.rx = Math.max(-22, Math.min(14, r.srx - dy * 0.25))
  }
  const onUp = () => {
    rot.current.dragging = false
  }

  const edge = '#dcefff'
  const mesh = '#bfe0ff'

  // Overall-risk glow behind the body + scan-beam tint.
  const worstSev = Object.values(organRisk).reduce(
    (w, v) => ((SEV_RANK[v?.severity] || 0) > SEV_RANK[w] ? v.severity : w),
    'calm'
  )
  const glowHex = riskOf(worstSev).hex
  const glowOpacity = [0.14, 0.28, 0.42, 0.52][SEV_RANK[worstSev]] ?? 0.14

  // Precompute the extrusion slices once.
  const slices = useMemo(
    () =>
      Array.from({ length: SLICES }, (_, i) => {
        const t = SLICES === 1 ? 0.5 : i / (SLICES - 1) // 0 = back, 1 = front
        return { z: BACK_Z + t * (FRONT_Z - BACK_Z), t }
      }),
    []
  )

  // A few drifting data motes (deterministic — no Math.random for demo stability).
  const motes = useMemo(
    () =>
      [
        { x: 40, delay: 0, dur: 5.5 },
        { x: 58, delay: 1.4, dur: 6.2 },
        { x: 50, delay: 2.7, dur: 5 },
        { x: 46, delay: 3.8, dur: 6.8 },
        { x: 62, delay: 0.8, dur: 5.8 },
      ],
    []
  )

  return (
    <div
      className="twin-grab relative h-full w-full"
      style={{ perspective: '1100px' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {/* shared defs */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe0ff" />
            <stop offset="45%" stopColor="#5a92f5" />
            <stop offset="100%" stopColor="#2c4fae" />
          </linearGradient>
          <radialGradient id={`organ-${uid}`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="55%" stopColor="currentColor" />
            <stop offset="100%" stopColor="currentColor" />
          </radialGradient>
          <linearGradient id={`scan-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={glowHex} stopOpacity="0" />
            <stop offset="50%" stopColor="#eafaff" stopOpacity="0.95" />
            <stop offset="100%" stopColor={glowHex} stopOpacity="0" />
          </linearGradient>
          <pattern id={`grid-${uid}`} width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M12 0 L0 0 L0 12" fill="none" stroke={mesh} strokeWidth="0.5" />
          </pattern>
          <clipPath id={`clip-${uid}`}>
            <BodyShapes />
          </clipPath>
        </defs>
      </svg>

      {/* centered 1:2 body board */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{ height: `${scale * 100}%`, aspectRatio: '240 / 480', transformStyle: 'preserve-3d' }}
        >
          {/* overall-risk glow behind the body */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ transform: 'translateZ(-46px)' }}
          >
            <div
              className="h-3/4 w-4/5 rounded-full transition-all duration-700"
              style={{
                background: `radial-gradient(circle, ${glowHex} 0%, transparent 70%)`,
                opacity: glowOpacity,
                filter: 'blur(28px)',
              }}
            />
          </div>

          {/* hologram base: glow pad + spinning ring under the feet */}
          <div
            className="pointer-events-none absolute left-1/2 bottom-[-4%]"
            style={{ transform: 'translateX(-50%)', transformStyle: 'preserve-3d' }}
          >
            <div
              className="h-8 w-40 rounded-[100%]"
              style={{
                background: `radial-gradient(ellipse at center, ${glowHex}88 0%, transparent 70%)`,
                filter: 'blur(6px)',
              }}
            />
            <div
              className="twin-ring absolute left-1/2 top-1/2 h-24 w-24 rounded-full"
              style={{
                transform: 'translate(-50%,-50%) rotateX(74deg)',
                border: `1.5px solid ${glowHex}`,
                boxShadow: `0 0 12px ${glowHex}`,
                opacity: 0.5,
              }}
            />
          </div>

          {/* the rotating rig */}
          <div
            ref={rigRef}
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(var(--rx,-3deg)) rotateY(var(--ry,16deg))',
            }}
          >
            {/* breathing wrapper (all volume + organs rise together) */}
            <div className="absolute inset-0 twin-breathe" style={{ transformStyle: 'preserve-3d' }}>
              {/* extruded volume slices */}
              {slices.map((s, i) => {
                // Depth shading: back slices dimmer + cooler, front brighter.
                const op = 0.05 + s.t * 0.06
                return (
                  <div
                    key={`s${i}`}
                    className="absolute inset-0"
                    style={{ transform: `translateZ(${s.z}px)`, transformStyle: 'preserve-3d' }}
                  >
                    <Layer opacity={op}>
                      <g fill={`url(#body-${uid})`}>
                        <BodyShapes />
                      </g>
                    </Layer>
                  </div>
                )
              })}

              {/* back wireframe face */}
              <div className="absolute inset-0" style={{ transform: `translateZ(${BACK_Z}px)` }}>
                <Layer opacity={0.32}>
                  <g clipPath={`url(#clip-${uid})`}>
                    <rect x="0" y="0" width="240" height="480" fill={`url(#grid-${uid})`} />
                  </g>
                </Layer>
              </div>

              {/* front wireframe face */}
              <div className="absolute inset-0" style={{ transform: `translateZ(${FRONT_Z}px)` }}>
                <Layer opacity={0.9}>
                  <g clipPath={`url(#clip-${uid})`}>
                    <rect x="0" y="0" width="240" height="480" fill={`url(#body-${uid})`} opacity="0.1" />
                    <rect x="0" y="0" width="240" height="480" fill={`url(#grid-${uid})`} />
                  </g>
                </Layer>
              </div>

              {/* sweeping scan beam (SMIL — dependency-free, guaranteed to run) */}
              <div className="absolute inset-0" style={{ transform: `translateZ(${FRONT_Z + 1}px)` }}>
                <Layer>
                  <g clipPath={`url(#clip-${uid})`}>
                    <rect x="0" width="240" height="26" fill={`url(#scan-${uid})`}>
                      <animate attributeName="y" from="-26" to="480" dur="3.4s" repeatCount="indefinite" />
                    </rect>
                    <rect x="0" width="240" height="1.5" fill="#eafaff" opacity="0.9">
                      <animate attributeName="y" from="-1" to="493" dur="3.4s" repeatCount="indefinite" />
                    </rect>
                  </g>
                </Layer>
              </div>

              {/* crisp glowing silhouette */}
              <div className="absolute inset-0" style={{ transform: `translateZ(${FRONT_Z + 0.5}px)` }}>
                <Layer opacity={0.95}>
                  <g
                    fill="none"
                    stroke={edge}
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 3px ${edge})` }}
                  >
                    <BodyShapes />
                  </g>
                </Layer>
              </div>

              {/* anatomical organs */}
              <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
                <Layer style={{ overflow: 'visible' }}>
                  {Object.entries(ORGANS).map(([key, geo]) => (
                    <OrganShape
                      key={key}
                      okey={key}
                      geo={geo}
                      entry={organRisk[key]}
                      isSel={selected === key}
                      onSelect={() => onSelect(key)}
                      movedRef={rot}
                      uid={uid}
                    />
                  ))}
                </Layer>
              </div>
            </div>
          </div>

          {/* rising data motes (screen-space, in front) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {motes.map((m, i) => (
              <span
                key={i}
                className="twin-mote absolute bottom-[30%] h-1 w-1 rounded-full"
                style={{
                  left: `${m.x}%`,
                  background: '#cfeeffcc',
                  boxShadow: '0 0 6px #cfeeff',
                  '--dur': `${m.dur}s`,
                  '--delay': `${m.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Callout pills beside each flagged organ (2D overlay — always readable). */}
          {!compact && (
            <div className="absolute inset-0" style={{ transform: 'translateZ(30px)' }}>
              {Object.entries(ORGANS).map(([key, geo]) => {
                const entry = organRisk[key]
                const intensity = intensityFor(entry)
                const flagged = (entry?.severity && entry.severity !== 'calm') || intensity > 34
                if (!flagged && selected !== key) return null
                const r = riskOf(entry?.severity || 'calm')
                const right = geo.side === 'right'
                const isSel = selected === key
                return (
                  <div
                    key={key}
                    className="pointer-events-none absolute"
                    style={{ left: `${geo.anchor.x}%`, top: `${geo.anchor.y}%` }}
                  >
                    <button
                      onClick={() => onSelect(key)}
                      className="pointer-events-auto absolute flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-2 pr-1 text-[11px] font-semibold text-white transition hover:scale-[1.05]"
                      style={{
                        transform: right ? 'translate(16px, -50%)' : 'translate(calc(-100% - 16px), -50%)',
                        background: 'rgba(9,14,27,0.92)',
                        border: `1px solid ${r.hex}`,
                        boxShadow: isSel ? `0 0 0 2px ${r.glow}` : '0 6px 16px rgba(0,0,0,0.35)',
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.hex }} />
                      {geo.label}
                      {callouts && (
                        <span
                          className="grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold"
                          style={{ background: r.hex, color: '#0b0f1b' }}
                        >
                          +
                        </span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
