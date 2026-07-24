import { useEffect, useRef } from 'react'

/**
 * The living background: one fixed, fullscreen WebGL quad behind the page.
 *
 * A warm ivory base with a slow fluid field underneath — cool blue and cyan
 * light, a little peach near the sections about warnings — nudged by the
 * pointer and shifting mood per section (`data-mood` on each <section>). It
 * renders at half resolution (it's a blurred field; nothing is lost), sits at
 * roughly 25–35% strength — present, never louder than the text — pauses when
 * the tab is hidden and
 * draws a single still frame under prefers-reduced-motion. Raw WebGL, no
 * library, and the ivory base is the fallback where WebGL is unavailable.
 */

// cool · warm · flow · grid · bloom · bloom position (x, y in 0–1, y up)
const MOODS = {
  default: [0.85, 0.12, 0.25, 0, 0.35, 0.5, 0.5],
  hero: [1.0, 0.0, 0.2, 0, 0.9, 0.74, 0.55],
  product: [0.75, 0.15, 1.0, 0, 0.3, 0.5, 0.5],
  changed: [0.5, 0.65, 0.4, 0, 0.2, 0.5, 0.5],
  ask: [0.6, 0.4, 0.3, 0.25, 0.4, 0.5, 0.45],
  evidence: [0.6, 0.2, 0.2, 1.0, 0.2, 0.5, 0.5],
  trust: [1.0, 0.0, 0.15, 0, 0.35, 0.5, 0.5],
  cta: [1.0, 0.0, 0.2, 0, 1.3, 0.5, 0.5],
}

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uPointer; uniform float uScroll;
uniform float uCool, uWarm, uFlow, uGrid, uBloom; uniform vec2 uBloomPos;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float ar = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * ar, uv.y);
  float t = uTime * 0.05;
  vec2 warp = vec2(fbm(p * 1.1 + t * 0.7), fbm(p * 1.1 - t * 0.5 + 4.2));
  vec2 q = p + (warp - 0.5) * 0.5 + (uPointer - 0.5) * 0.15 + vec2(t * uFlow * 0.8, uScroll * 0.15);
  float n = fbm(q * 1.4);
  float cool = smoothstep(0.28, 0.78, n) * uCool;
  float n2 = fbm(q * 1.0 + vec2(7.3, -2.1) - t * 0.4);
  float warm = smoothstep(0.5, 0.88, n2) * uWarm;
  vec2 bp = vec2(uBloomPos.x * ar, uBloomPos.y);
  float d = distance(p, bp);
  float bloom = exp(-d * d * 5.0) * uBloom;
  vec2 gc = vec2(0.9 * ar, 0.5);
  float ripple = uGrid * (0.5 + 0.5 * sin(length(p - gc) * 26.0 - uTime * 0.8)) * smoothstep(0.7, 0.15, length(p - gc));
  vec3 ivory = vec3(0.943, 0.938, 0.918);
  vec3 blue = vec3(0.45, 0.62, 0.98), cyan = vec3(0.40, 0.78, 0.72), peach = vec3(0.95, 0.66, 0.48);
  vec3 col = ivory;
  // a broad, slow glow that follows the pointer, so the field always feels lit
  vec2 pp = vec2(uPointer.x * ar, uPointer.y);
  float pglow = exp(-dot(p - pp, p - pp) * 2.2) * 0.14;
  col = mix(col, blue, cool * 0.30 + bloom * 0.34 + pglow);
  col = mix(col, cyan, cool * 0.13 * (1.0 - uWarm) + ripple * 0.12);
  col = mix(col, peach, warm * 0.24);
  // gentle vignette: light through glass, not a flat sheet
  float vig = smoothstep(1.3, 0.3, length(uv - 0.5) * 1.6);
  col *= 0.955 + 0.045 * vig;
  gl_FragColor = vec4(col, 1.0);
}`

export default function Atmosphere() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' })
    if (!gl) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const compile = (type, src) => {
      const sh = gl.createShader(type)
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      return sh
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const a = gl.getAttribLocation(prog, 'a')
    gl.enableVertexAttribArray(a)
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)

    const U = {}
    for (const n of ['uRes', 'uTime', 'uPointer', 'uScroll', 'uCool', 'uWarm', 'uFlow', 'uGrid', 'uBloom', 'uBloomPos']) {
      U[n] = gl.getUniformLocation(prog, n)
    }

    const state = {
      pointer: [0.5, 0.5],
      pTarget: [0.5, 0.5],
      mood: [...MOODS.default],
      mTarget: [...MOODS.default],
      raf: 0,
      running: true,
    }

    const resize = () => {
      const scale = 0.5
      canvas.width = Math.max(1, Math.floor(window.innerWidth * scale))
      canvas.height = Math.max(1, Math.floor(window.innerHeight * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const onPointer = (e) => {
      state.pTarget = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight]
    }

    // Which section owns the viewport's centre decides the mood.
    const onScroll = () => {
      const mid = window.innerHeight * 0.5
      let best = 'default'
      for (const el of document.querySelectorAll('[data-mood]')) {
        const r = el.getBoundingClientRect()
        if (r.top <= mid && r.bottom >= mid) {
          best = el.dataset.mood
          break
        }
      }
      state.mTarget = MOODS[best] || MOODS.default
    }

    const draw = (now) => {
      const k = reduce ? 1 : 0.035
      for (let i = 0; i < 7; i += 1) state.mood[i] += (state.mTarget[i] - state.mood[i]) * k
      state.pointer[0] += (state.pTarget[0] - state.pointer[0]) * 0.05
      state.pointer[1] += (state.pTarget[1] - state.pointer[1]) * 0.05
      gl.uniform2f(U.uRes, canvas.width, canvas.height)
      gl.uniform1f(U.uTime, reduce ? 0 : now / 1000)
      gl.uniform2f(U.uPointer, state.pointer[0], state.pointer[1])
      gl.uniform1f(U.uScroll, window.scrollY / window.innerHeight)
      gl.uniform1f(U.uCool, state.mood[0])
      gl.uniform1f(U.uWarm, state.mood[1])
      gl.uniform1f(U.uFlow, state.mood[2])
      gl.uniform1f(U.uGrid, state.mood[3])
      gl.uniform1f(U.uBloom, state.mood[4])
      gl.uniform2f(U.uBloomPos, state.mood[5], state.mood[6])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const loop = (now) => {
      if (!state.running) return
      if (!document.hidden) draw(now)
      state.raf = requestAnimationFrame(loop)
    }

    resize()
    onScroll()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    if (!reduce) window.addEventListener('pointermove', onPointer, { passive: true })

    if (reduce) {
      // One still frame; re-draw on resize only.
      draw(0)
      const still = () => draw(0)
      window.addEventListener('resize', still)
      return () => {
        window.removeEventListener('resize', resize)
        window.removeEventListener('resize', still)
        window.removeEventListener('scroll', onScroll)
      }
    }

    state.raf = requestAnimationFrame(loop)
    return () => {
      state.running = false
      cancelAnimationFrame(state.raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])

  return (
    <div className="atmosphere" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  )
}
