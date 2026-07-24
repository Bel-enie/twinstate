import { useEffect, useRef } from 'react'

/**
 * The page's atmosphere: one fixed, viewport-sized WebGL canvas behind the
 * whole landing page, drawing a "pearlescent glass flow" — three broad,
 * curved, translucent ribbons over a pearl-grey base. Each ribbon is a curved
 * surface with a softly shaded body, a luminous edge and a narrow white
 * reflection that reveals its curvature. Slow deformation (sums of slow sines,
 * no noise blobs), a gentle bend toward the pointer, and a composition that
 * evolves continuously with scroll, anchored to the real sections.
 *
 * Decorative only: aria-hidden, pointer-events none, and it never represents
 * a measurement. Everything tunable lives in ATMOSPHERE below.
 *
 * Engineering notes:
 *  - raw WebGL 1, one fullscreen triangle, no library, no post-processing
 *  - one rAF loop; pointer/scroll/composition held in refs; delta-time
 *    smoothing; no React state or allocations per frame
 *  - DPR capped (1.5 desktop / 1 mobile), lowered further if frames run long
 *  - the static CSS composition on .atmosphere (index.css) shows immediately;
 *    the canvas fades in over it once the first frame is drawn
 *  - pauses while the document is hidden; a single still frame under
 *    prefers-reduced-motion (composition still follows scroll)
 *  - handles context loss/restore; releases GPU objects on unmount (the
 *    context itself stays with the canvas so a remount reuses it)
 *  - `?nogl=1` forces the fallback, for testing
 */

export const ATMOSPHERE = {
  palette: {
    base: '#F1F3F8', // pearl grey
    blue: '#5278ED', // Twinstate blue
    lilac: '#ADA1DE',
    cyan: '#95D6E2',
  },
  intensity: 0.92, // overall ribbon presence (0–1.2)
  highlight: 0.3, // strength of the reflections (kept off pure white)
  speed: 1.0, // deformation speed multiplier
  pointerStrength: 1.0, // how much the field bends toward the pointer (0 disables)
  grain: 0.014, // static grain to soften banding (0 disables)
  quality: { desktopDpr: 1.5, mobileDpr: 1, minScale: 0.5, targetMs: 20 },
  mobile: { ribbons: 2, amp: 0.6 }, // simpler composition on small screens
  /**
   * Composition keyframes, anchored to sections (an `at` selector) so the
   * field evolves with the page rather than at fixed scroll fractions.
   * Ribbon = a:[baseY, amplitude, halfWidth, alpha]  b:[freq, phase, speed, highlightPos]
   * Order: lilac (back), blue (middle), cyan (front accent).
   * `calm`/`calmX` quieten the field around headings (x in 0–1 from the left).
   */
  keyframes: [
    {
      at: '#hero', calm: 0.55, calmX: 0.22, flow: 0.0, contrast: 1.0,
      ribbons: [
        { a: [0.66, 0.15, 0.24, 0.5], b: [1.35, 0.6, 0.11, 0.35] },
        { a: [0.44, 0.2, 0.17, 0.62], b: [1.15, 2.4, 0.09, 0.28] },
        { a: [0.17, 0.09, 0.09, 0.42], b: [2.0, 4.1, 0.13, 0.42] },
      ],
    },
    {
      at: '#product', calm: 0.25, calmX: 0.3, flow: 0.7, contrast: 0.9,
      ribbons: [
        { a: [0.72, 0.08, 0.28, 0.42], b: [0.9, 1.1, 0.09, 0.3] },
        { a: [0.4, 0.1, 0.24, 0.5], b: [0.8, 2.9, 0.08, 0.3] },
        { a: [0.14, 0.06, 0.1, 0.36], b: [1.6, 4.6, 0.11, 0.4] },
      ],
    },
    {
      at: '#evidence', calm: 0.35, calmX: 0.35, flow: 1.2, contrast: 0.45,
      ribbons: [
        { a: [0.78, 0.06, 0.26, 0.3], b: [0.9, 1.6, 0.07, 0.3] },
        { a: [0.34, 0.07, 0.22, 0.34], b: [0.8, 3.3, 0.07, 0.3] },
        { a: [0.12, 0.04, 0.09, 0.22], b: [1.5, 5.0, 0.09, 0.4] },
      ],
    },
    {
      at: '#trust', calm: 0.3, calmX: 0.35, flow: 1.6, contrast: 0.4,
      ribbons: [
        { a: [0.8, 0.05, 0.24, 0.26], b: [0.9, 2.0, 0.07, 0.3] },
        { a: [0.3, 0.06, 0.2, 0.3], b: [0.8, 3.7, 0.07, 0.3] },
        { a: [0.1, 0.04, 0.08, 0.2], b: [1.5, 5.4, 0.09, 0.4] },
      ],
    },
    {
      at: '#cta', calm: 0.3, calmX: 0.5, flow: 2.1, contrast: 0.72,
      ribbons: [
        { a: [0.74, 0.1, 0.22, 0.4], b: [1.2, 2.3, 0.1, 0.32] },
        { a: [0.5, 0.12, 0.26, 0.66], b: [1.0, 4.2, 0.08, 0.3] },
        { a: [0.22, 0.08, 0.11, 0.4], b: [1.7, 5.9, 0.11, 0.4] },
      ],
    },
  ],
}

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uPointer; uniform float uPointerStrength;
uniform vec3 uBase, uC0, uC1, uC2;
uniform float uIntensity, uHighlight, uGrain, uCalm, uCalmX, uFlow, uContrast, uRibbons;
uniform vec4 uA0, uB0, uA1, uB1, uA2, uB2;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// A ribbon is a curved surface: a centre line y(x), a half-width that breathes
// along x (a fold), and a cylinder-like cross-section for shading.
vec4 ribbon(vec2 p, vec4 a, vec4 b, vec3 tint, float bend, vec3 L) {
  float x = p.x + uFlow;
  float y = a.x + a.y * sin(b.x * x + b.y + uTime * b.z)
                + a.y * 0.45 * sin(b.x * 2.1 * x - b.y * 0.7 - uTime * b.z * 0.6) + bend;
  float tw = 0.5 + 0.5 * sin(b.x * 1.3 * x + b.y * 1.7 + uTime * b.z * 0.4);
  float w = a.z * (0.75 + 0.5 * tw);
  float d = (p.y - y) / w;
  float inside = 1.0 - smoothstep(0.9, 1.0, abs(d));
  if (inside <= 0.001) return vec4(0.0);
  float dd = clamp(d, -1.0, 1.0);
  float z = sqrt(max(0.0, 1.0 - dd * dd));
  vec3 n = normalize(vec3(0.0, dd * 0.9, z));
  float lam = 0.52 + 0.42 * max(dot(n, L), 0.0);
  float rim = pow(1.0 - z, 2.5);
  float hp = b.w + 0.25 * (tw - 0.5);
  float spec = exp(-pow((dd - hp) / 0.07, 2.0));
  float spec2 = exp(-pow((dd + 0.55) / 0.16, 2.0)) * 0.35;
  // Reflections are a pale tint of the ribbon, never pure white, and the body
  // is shaded down before they are added — so a highlight lifts the surface
  // instead of blowing it out to glare.
  vec3 sheen = mix(tint, vec3(1.0), 0.72);
  vec3 body = mix(tint * 0.86, vec3(1.0), 0.1 * (1.0 - z)) * lam;
  body += sheen * (spec + spec2) * uHighlight;
  body += tint * rim * 0.4;
  body = min(body, vec3(0.93));
  float alpha = a.w * inside * (0.72 + 0.28 * z);
  return vec4(body, alpha);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float ar = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * ar, uv.y);
  vec3 L = normalize(vec3(-0.35, 0.75, 0.55));
  float px = uPointer.x * ar;
  float bendG = exp(-pow((p.x - px) / (0.35 * ar), 2.0));
  float bend = (uPointer.y - 0.5) * 0.16 * uPointerStrength * bendG;
  float calm = 1.0 - uCalm * exp(-pow((uv.x - uCalmX) / 0.26, 2.0));
  float k = uIntensity * uContrast * calm;

  vec3 col = uBase;
  vec4 r;
  r = ribbon(p, uA0, uB0, uC0, bend * 0.6, L); col = mix(col, r.rgb, r.a * k);
  r = ribbon(p, uA1, uB1, uC1, bend, L);       col = mix(col, r.rgb, r.a * k);
  if (uRibbons > 2.5) { r = ribbon(p, uA2, uB2, uC2, bend * 1.3, L); col = mix(col, r.rgb, r.a * k); }

  // Hard ceiling on brightness: text over this field must never approach the
  // luminance of the copy drawn on top of it, whatever the ribbons are doing.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col *= 1.0 - 0.55 * smoothstep(0.86, 0.98, lum);

  col += (hash(gl_FragCoord.xy) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}`

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const isMobile = () => window.matchMedia?.('(max-width: 640px), (pointer: coarse)').matches
const wantsStill = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const forcedOff = () => /[?&]nogl=1/.test(window.location.search)

export default function Atmosphere() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || forcedOff()) return undefined
    const cfg = ATMOSPHERE
    const mobile = isMobile()
    const still = wantsStill()

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' })
    if (!gl) return undefined
    const loseExt = gl.getExtension('WEBGL_lose_context')
    if (gl.isContextLost()) loseExt?.restoreContext()

    // ── program ──
    let prog = null
    let buf = null
    const U = {}
    const build = () => {
      const compile = (type, src) => {
        const sh = gl.createShader(type)
        gl.shaderSource(sh, src)
        gl.compileShader(sh)
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader')
        return sh
      }
      prog = gl.createProgram()
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link')
      gl.useProgram(prog)
      buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const a = gl.getAttribLocation(prog, 'a')
      gl.enableVertexAttribArray(a)
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
      for (const n of [
        'uRes', 'uTime', 'uPointer', 'uPointerStrength', 'uBase', 'uC0', 'uC1', 'uC2', 'uIntensity', 'uHighlight',
        'uGrain', 'uCalm', 'uCalmX', 'uFlow', 'uContrast', 'uRibbons', 'uA0', 'uB0', 'uA1', 'uB1', 'uA2', 'uB2',
      ]) {
        U[n] = gl.getUniformLocation(prog, n)
      }
      const pal = cfg.palette
      gl.uniform3fv(U.uBase, hex(pal.base))
      gl.uniform3fv(U.uC0, hex(pal.lilac))
      gl.uniform3fv(U.uC1, hex(pal.blue))
      gl.uniform3fv(U.uC2, hex(pal.cyan))
      gl.uniform1f(U.uIntensity, cfg.intensity)
      gl.uniform1f(U.uHighlight, cfg.highlight)
      gl.uniform1f(U.uGrain, cfg.grain)
      gl.uniform1f(U.uPointerStrength, mobile || still ? 0 : cfg.pointerStrength)
      gl.uniform1f(U.uRibbons, mobile ? cfg.mobile.ribbons : 3)
    }
    // Context loss can happen at any time — including during startup on busy
    // GPUs — so the handlers go on before the first build, and a failed build
    // on a lost context simply waits for `webglcontextrestored`.
    let built = false
    const tryBuild = () => {
      try {
        build()
        built = true
      } catch (e) {
        built = false
        if (!gl.isContextLost()) {
          console.warn('[atmosphere] shader failed; keeping the static fallback', String(e.message || e), 'glError', gl.getError())
        }
      }
      return built
    }

    // ── state: refs only, nothing allocated per frame ──
    const st = {
      running: true,
      raf: 0,
      last: 0,
      scale: 1,
      dpr: Math.min(window.devicePixelRatio || 1, mobile ? cfg.quality.mobileDpr : cfg.quality.desktopDpr),
      pointer: new Float32Array([0.5, 0.5]),
      pTarget: new Float32Array([0.5, 0.5]),
      scroll: 0,
      scrollTarget: 0,
      anchors: new Float32Array(cfg.keyframes.length),
      cur: {
        calm: 0, calmX: 0.5, flow: 0, contrast: 1,
        a: [new Float32Array(4), new Float32Array(4), new Float32Array(4)],
        b: [new Float32Array(4), new Float32Array(4), new Float32Array(4)],
      },
      frameMs: 0,
      frames: 0,
      shown: false,
    }

    const resize = () => {
      const w = Math.max(1, Math.floor(window.innerWidth * st.dpr * st.scale))
      const h = Math.max(1, Math.floor(window.innerHeight * st.dpr * st.scale))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }

    const scrollMax = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const onScroll = () => {
      st.scrollTarget = Math.min(1, Math.max(0, window.scrollY / scrollMax()))
    }
    // Keyframe positions come from where the sections actually are.
    const layout = () => {
      const max = scrollMax()
      cfg.keyframes.forEach((k, i) => {
        const el = document.querySelector(k.at)
        const top = el ? el.getBoundingClientRect().top + window.scrollY : (i * max) / (cfg.keyframes.length - 1)
        st.anchors[i] = Math.min(1, Math.max(0, (top - window.innerHeight * 0.35) / max))
      })
      st.anchors[0] = 0
      onScroll()
    }
    const onPointer = (e) => {
      st.pTarget[0] = e.clientX / window.innerWidth
      st.pTarget[1] = 1 - e.clientY / window.innerHeight
    }

    // Interpolate the composition for a scroll position (writes into st.cur).
    const compose = (s) => {
      const kf = cfg.keyframes
      let i = 0
      while (i < kf.length - 2 && s > st.anchors[i + 1]) i += 1
      const t0 = st.anchors[i]
      const t1 = st.anchors[i + 1]
      const t = t1 > t0 ? Math.min(1, Math.max(0, (s - t0) / (t1 - t0))) : 0
      const u = t * t * (3 - 2 * t)
      const A = kf[i]
      const B = kf[i + 1]
      const c = st.cur
      c.calm = A.calm + (B.calm - A.calm) * u
      c.calmX = A.calmX + (B.calmX - A.calmX) * u
      c.flow = A.flow + (B.flow - A.flow) * u
      c.contrast = A.contrast + (B.contrast - A.contrast) * u
      const ampK = mobile ? cfg.mobile.amp : 1
      for (let r = 0; r < 3; r += 1) {
        const ra = A.ribbons[r]
        const rb = B.ribbons[r]
        for (let j = 0; j < 4; j += 1) {
          c.a[r][j] = ra.a[j] + (rb.a[j] - ra.a[j]) * u
          c.b[r][j] = ra.b[j] + (rb.b[j] - ra.b[j]) * u
        }
        c.a[r][1] *= ampK
        c.b[r][2] *= cfg.speed
      }
    }

    const draw = (now) => {
      if (!built) return
      const dt = st.last ? Math.min(0.1, (now - st.last) / 1000) : 0.016
      st.last = now
      const ks = still ? 1 : 1 - Math.exp(-dt * 3.2)
      st.scroll += (st.scrollTarget - st.scroll) * ks
      const kp = still ? 1 : 1 - Math.exp(-dt * 4)
      st.pointer[0] += (st.pTarget[0] - st.pointer[0]) * kp
      st.pointer[1] += (st.pTarget[1] - st.pointer[1]) * kp
      compose(st.scroll)
      const c = st.cur
      gl.uniform2f(U.uRes, canvas.width, canvas.height)
      gl.uniform1f(U.uTime, still ? 0 : now / 1000)
      gl.uniform2fv(U.uPointer, st.pointer)
      gl.uniform1f(U.uCalm, c.calm)
      gl.uniform1f(U.uCalmX, c.calmX)
      gl.uniform1f(U.uFlow, c.flow)
      gl.uniform1f(U.uContrast, c.contrast)
      gl.uniform4fv(U.uA0, c.a[0])
      gl.uniform4fv(U.uB0, c.b[0])
      gl.uniform4fv(U.uA1, c.a[1])
      gl.uniform4fv(U.uB1, c.b[1])
      gl.uniform4fv(U.uA2, c.a[2])
      gl.uniform4fv(U.uB2, c.b[2])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!st.shown) {
        st.shown = true
        canvas.style.opacity = '1'
      }
    }

    // Adaptive quality: if frames run long, render smaller (it's a soft field).
    const measure = (ms) => {
      st.frameMs += ms
      st.frames += 1
      if (st.frames >= 45) {
        const avg = st.frameMs / st.frames
        st.frameMs = 0
        st.frames = 0
        if (avg > cfg.quality.targetMs && st.scale > cfg.quality.minScale) {
          st.scale = Math.max(cfg.quality.minScale, st.scale - 0.25)
          resize()
        }
      }
    }

    const loop = (now) => {
      if (!st.running) return
      if (!document.hidden && built) {
        const t0 = performance.now()
        draw(now)
        measure(performance.now() - t0)
      }
      st.raf = requestAnimationFrame(loop)
    }

    // ── context loss ──
    const onLost = (e) => {
      e.preventDefault()
      canvas.style.opacity = '0'
      cancelAnimationFrame(st.raf)
      built = false
    }
    const onRestored = () => {
      if (!tryBuild()) return
      resize()
      st.shown = false
      if (still) draw(0)
      else st.raf = requestAnimationFrame(loop)
    }
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => layout()) : null
    ro?.observe(document.body)
    window.addEventListener('resize', resize)
    window.addEventListener('resize', layout)
    window.addEventListener('scroll', onScroll, { passive: true })
    if (!mobile && !still) window.addEventListener('pointermove', onPointer, { passive: true })

    resize()
    layout()

    const redraw = () => built && draw(0)
    if (tryBuild()) {
      if (still) draw(0)
      else st.raf = requestAnimationFrame(loop)
    } else if (!gl.isContextLost()) {
      // A genuine shader error: nothing to wait for; the fallback stays.
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
    }
    if (still) {
      window.addEventListener('resize', redraw)
      window.addEventListener('scroll', redraw, { passive: true })
    }

    return () => {
      st.running = false
      cancelAnimationFrame(st.raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('resize', layout)
      window.removeEventListener('resize', redraw)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', redraw)
      window.removeEventListener('pointermove', onPointer)
      ro?.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      if (!gl.isContextLost()) {
        gl.deleteBuffer(buf)
        gl.deleteProgram(prog)
      }
    }
  }, [])

  return (
    <div className="atmosphere" aria-hidden="true">
      <canvas ref={ref} tabIndex={-1} />
    </div>
  )
}
