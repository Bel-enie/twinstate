import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { RISK } from '../../utils/risk.js'

/**
 * The living 3D twin — a WebGL body that reacts to real app state.
 *
 *   <HealthTwin organRisk={{ heart: { severity: 'caution' }, … }} />
 *
 * Translucent navy shell with a fresnel rim and a slow scan band; organs
 * inside, lit by their own status colour. When an organ's status changes the
 * change is *staged* — an internal pulse, then the glow ramps, then the label
 * appears — so a timeline scrub reads as the body reacting, not a repaint.
 * Slow breathing, mouse-follow rotation, click an organ to select it. No
 * particles, no post-processing: the glow is an additive halo sprite.
 *
 * Only ever loaded lazily (see index.jsx) so the rest of the app never pays
 * for three.js.
 */

// Organ placement in body space (body ≈ 3.4 units tall, feet at y ≈ -1.6).
const ORGANS = {
  brain: { pos: [0, 1.6, 0], size: [0.2, 0.16, 0.18], label: 'Brain' },
  heart: { pos: [-0.1, 0.88, 0.12], size: [0.12, 0.14, 0.11], label: 'Heart' },
  liver: { pos: [0.17, 0.52, 0.1], size: [0.22, 0.13, 0.13], label: 'Liver' },
  stomach: { pos: [-0.15, 0.5, 0.11], size: [0.14, 0.11, 0.1], label: 'Stomach' },
  kidneys: { pos: [0, 0.3, -0.1], size: [0.1, 0.13, 0.08], label: 'Kidneys', pair: 0.19 },
}

const INTENSITY = { calm: 0.35, watch: 0.75, caution: 0.95, urgent: 1.1 }
const isFlagged = (sev) => sev && sev !== 'calm'
const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// ── Materials ─────────────────────────────────────────────────────────────
const SHELL_VERT = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying float vY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vY = (modelMatrix * vec4(position, 1.0)).y;
    gl_Position = projectionMatrix * mv;
  }`
const SHELL_FRAG = /* glsl */ `
  uniform vec3 uRim; uniform vec3 uInner; uniform float uTime;
  varying vec3 vN; varying vec3 vV; varying float vY;
  void main() {
    float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.4);
    float scan = (1.0 - smoothstep(0.0, 0.05, abs(fract(vY * 0.3 - uTime * 0.05) - 0.5))) * 0.35;
    float grid = step(0.95, fract(vY * 16.0)) * 0.05;
    vec3 col = mix(uInner, uRim, f) + uRim * scan;
    float a = 0.13 + f * 0.8 + scan * 0.35 + grid;
    gl_FragColor = vec4(col, clamp(a, 0.0, 0.95));
  }`

function useShellMaterial() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SHELL_VERT,
        fragmentShader: SHELL_FRAG,
        uniforms: {
          uRim: { value: new THREE.Color('#7FB4FF') },
          uInner: { value: new THREE.Color('#24365F') },
          uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    []
  )
}

/** Soft radial halo, drawn once to a canvas. */
function useHaloTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.35, 'rgba(255,255,255,0.45)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

// ── Body shell ────────────────────────────────────────────────────────────
function Shell({ material }) {
  const parts = useMemo(() => {
    const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 20)
    return [
      { g: new THREE.SphereGeometry(0.25, 28, 20), p: [0, 1.6, 0] },
      { g: new THREE.CylinderGeometry(0.09, 0.11, 0.2, 16), p: [0, 1.32, 0] },
      { g: cap(0.36, 0.86), p: [0, 0.78, 0], s: [1, 1, 0.72] },
      { g: new THREE.SphereGeometry(0.34, 24, 16), p: [0, 0.02, 0], s: [1, 0.7, 0.72] },
      { g: cap(0.1, 1.0), p: [-0.5, 0.72, 0], r: [0, 0, 0.12] },
      { g: cap(0.1, 1.0), p: [0.5, 0.72, 0], r: [0, 0, -0.12] },
      { g: cap(0.13, 1.25), p: [-0.19, -0.85, 0] },
      { g: cap(0.13, 1.25), p: [0.19, -0.85, 0] },
    ]
  }, [])
  return (
    <group renderOrder={2}>
      {parts.map((part, i) => (
        <mesh
          key={i}
          geometry={part.g}
          material={material}
          position={part.p}
          rotation={part.r || [0, 0, 0]}
          scale={part.s || [1, 1, 1]}
        />
      ))}
    </group>
  )
}

// ── One organ, with staged status transitions ─────────────────────────────
function Organ({ id, severity, halo, selected, onSelect, showLabel, motion }) {
  const spec = ORGANS[id]
  const meshRef = useRef()
  const matRef = useRef()
  const haloRef = useRef()
  const haloMatRef = useRef()
  const st = useRef({
    cur: INTENSITY.calm,
    color: new THREE.Color(RISK.calm.hex),
    prevSev: severity,
    tStart: -Infinity,
    appearing: false,
  })
  const [labelOn, setLabelOn] = useState(isFlagged(severity))
  const [hover, setHover] = useState(false)

  const target = RISK[severity] || RISK.calm
  const targetColor = useMemo(() => new THREE.Color(target.hex), [target.hex])

  // Detect a status change and start the staged transition.
  useEffect(() => {
    const s = st.current
    if (s.prevSev !== severity) {
      s.tStart = performance.now() / 1000
      s.appearing = !isFlagged(s.prevSev) && isFlagged(severity)
      s.prevSev = severity
      if (!isFlagged(severity)) setLabelOn(false)
      if (!motion) setLabelOn(isFlagged(severity))
    }
  }, [severity, motion])

  useFrame(({ clock }) => {
    const s = st.current
    const now = clock.getElapsedTime()
    const since = performance.now() / 1000 - s.tStart
    const inPulse = motion && s.appearing && since < 0.7
    const inRamp = motion && s.appearing && since >= 0.7 && since < 1.5

    // Colour: hold calm through the pulse, then ramp to the status colour.
    const ramp = motion ? (inPulse ? 0 : inRamp ? (since - 0.7) / 0.8 : 1) : 1
    if (s.appearing && motion) s.color.copy(new THREE.Color(RISK.calm.hex)).lerp(targetColor, ramp)
    else s.color.lerp(targetColor, motion ? 0.08 : 1)

    // Intensity: eased toward the status level, plus a slow pulse when flagged.
    const goal = INTENSITY[severity] || INTENSITY.calm
    s.cur += (goal - s.cur) * (motion ? 0.06 : 1)
    const flagged = isFlagged(severity)
    const slow = flagged && motion ? 1 + 0.12 * Math.sin(now * 2.2) : 1
    const beat =
      id === 'heart' && motion
        ? (() => {
            const p = (now % 1.15) / 1.15
            if (p < 0.08) return Math.sin((p / 0.08) * Math.PI) * 0.1
            if (p > 0.16 && p < 0.24) return Math.sin(((p - 0.16) / 0.08) * Math.PI) * 0.07
            return 0
          })()
        : 0
    const pulse = inPulse ? 1 + 0.22 * Math.abs(Math.sin(since * 9)) : 1
    const sel = selected || hover ? 1.12 : 1

    const k = pulse * sel * (1 + beat)
    if (meshRef.current) meshRef.current.scale.set(spec.size[0] * k, spec.size[1] * k, spec.size[2] * k)
    if (matRef.current) {
      matRef.current.color.copy(s.color)
      matRef.current.emissive.copy(s.color)
      matRef.current.emissiveIntensity = 0.35 + s.cur * 0.9
      matRef.current.opacity = 0.75 + s.cur * 0.2
    }
    if (haloRef.current) {
      const hs = (0.55 + s.cur * 1.1) * slow * pulse * (id === 'brain' ? 1.3 : 1)
      haloRef.current.scale.set(hs, hs, 1)
    }
    if (haloMatRef.current) {
      haloMatRef.current.color.copy(s.color)
      haloMatRef.current.opacity = flagged ? 0.55 * s.cur : 0.18
    }
    if (motion && s.appearing && since >= 1.5 && !labelOn && flagged) setLabelOn(true)
  })

  const geo = useMemo(() => new THREE.SphereGeometry(1, 24, 18), [])
  const positions = spec.pair ? [[-spec.pair, 0, 0], [spec.pair, 0, 0]] : [[0, 0, 0]]

  return (
    <group position={spec.pos}>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          <mesh
            ref={i === 0 ? meshRef : undefined}
            geometry={geo}
            scale={spec.size}
            renderOrder={1}
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.(id)
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHover(true)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              setHover(false)
              document.body.style.cursor = ''
            }}
          >
            <meshStandardMaterial
              ref={i === 0 ? matRef : undefined}
              transparent
              roughness={0.45}
              metalness={0.1}
              color={target.hex}
              emissive={target.hex}
            />
          </mesh>
          <sprite ref={i === 0 ? haloRef : undefined} renderOrder={0}>
            <spriteMaterial
              ref={i === 0 ? haloMatRef : undefined}
              map={halo}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              color={target.hex}
            />
          </sprite>
        </group>
      ))}

      {showLabel && labelOn && (
        <Html
          position={[(spec.pos[0] > 0 ? 1 : -1) * (spec.size[0] + 0.1), 0.02, 0]}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`twin-label flex items-center gap-1.5 whitespace-nowrap ${spec.pos[0] > 0 ? '' : 'flex-row-reverse'}`}
            style={{ transform: `translate(${spec.pos[0] > 0 ? '0' : '-100%'}, -50%)` }}
          >
            <span className="block h-px w-4" style={{ background: target.hex }} />
            <span
              className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold"
              style={{
                borderColor: `${target.hex}88`,
                background: 'rgba(10,14,26,0.85)',
                color: '#E6ECF7',
              }}
            >
              {spec.label} · {severity}
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

// ── The rig: breathing, mouse-follow, idle drift ──────────────────────────
function Rig({ pointer, motion, children }) {
  const rig = useRef()
  const chest = useRef()
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!rig.current) return
    const p = pointer.current
    const idle = motion ? Math.sin(t * 0.25) * 0.22 : 0
    const ty = p ? p.x * 0.75 : idle
    const tx = p ? -p.y * 0.25 : 0
    rig.current.rotation.y += (ty - rig.current.rotation.y) * 0.05
    rig.current.rotation.x += (tx - rig.current.rotation.x) * 0.05
    if (chest.current && motion) {
      const b = 1 + 0.012 * Math.sin(t * 1.35)
      chest.current.scale.set(1, b, 1 + 0.006 * Math.sin(t * 1.35))
    }
  })
  return (
    <group ref={rig}>
      <group ref={chest}>{children}</group>
    </group>
  )
}

function Scene({ organRisk, selected, onSelect, showLabels, pointer, motion }) {
  const shell = useShellMaterial()
  const halo = useHaloTexture()
  useFrame(({ clock }) => {
    shell.uniforms.uTime.value = clock.getElapsedTime()
  })
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2.5, 3.5, 4]} intensity={1.1} />
      <Rig pointer={pointer} motion={motion}>
        <group position={[0, -0.05, 0]}>
          {Object.keys(ORGANS).map((id) => (
            <Organ
              key={id}
              id={id}
              severity={organRisk?.[id]?.severity || 'calm'}
              halo={halo}
              selected={selected === id}
              onSelect={onSelect}
              showLabel={showLabels}
              motion={motion}
            />
          ))}
          <Shell material={shell} />
          {/* Base ring */}
          <mesh position={[0, -1.62, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
            <ringGeometry args={[0.55, 0.62, 48]} />
            <meshBasicMaterial color="#6AA6FF" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </Rig>
    </>
  )
}

export default function HealthTwin({
  organRisk = {},
  selected = null,
  onSelect,
  showLabels = true,
  active = true,
  className = '',
}) {
  const pointer = useRef(null)
  const motion = !reduceMotion()

  return (
    <div
      className={`relative h-full w-full ${className}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        pointer.current = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 }
      }}
      onPointerLeave={() => {
        pointer.current = null
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.05, 6.6], fov: 32 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        frameloop={active ? 'always' : 'never'}
        style={{ background: 'transparent' }}
        onPointerMissed={() => onSelect?.(null)}
      >
        <Scene
          organRisk={organRisk}
          selected={selected}
          onSelect={onSelect}
          showLabels={showLabels}
          pointer={pointer}
          motion={motion}
        />
      </Canvas>
    </div>
  )
}
