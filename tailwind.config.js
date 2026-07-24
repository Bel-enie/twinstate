/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, approachable base — not clinical.
        cream: '#FBF7F0',
        paper: '#F4F3EF', // off-white ground the landing page sits on
        shell: '#E8E6E1', // soft backdrop the app "card" floats on
        ink: '#1F2430',
        slate: {
          soft: '#5B6472',
        },
        // ── Dark "holographic" surface scale ──────────────────────────────
        // The twin is a glowing hologram: glow only reads as emitted light on a
        // dark ground. These are the tokens the landing page is built on.
        void: '#0A0E1A', // page ground, darker than the stage
        deep: '#0E1526', // stage / panel ground (matches .stage-backdrop)
        panel: '#141C31', // raised card surface
        hairline: '#243049', // borders at rest
        mist: '#96A3BD', // secondary text on dark
        frost: '#E6ECF7', // primary text on dark
        // Non-alarming, warm risk scale (low -> high).
        risk: {
          calm: '#3FB8A0', // teal — all good
          watch: '#F4B860', // warm amber — keep an eye
          caution: '#EF8354', // soft coral — take action
          urgent: '#E0567A', // rose (warm, not fire-engine red)
        },
        brand: {
          50: '#EEF6FF',
          100: '#D9EBFF',
          200: '#B9D4FF',
          300: '#8FBBFF',
          400: '#6AA6FF',
          500: '#4B84F0',
          600: '#3A66D8',
          700: '#2F52B0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Editorial serif for headlines only — figures and UI stay in Inter.
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(31, 36, 48, 0.18)',
        glow: '0 0 40px -6px rgba(75, 132, 240, 0.35)',
        shell: '0 40px 120px -50px rgba(31, 36, 48, 0.55)',
        card: '0 2px 10px -3px rgba(31, 36, 48, 0.10)',
        // Dark-surface elevation: depth comes from shadow + a light top edge.
        lift: '0 24px 60px -24px rgba(0, 0, 0, 0.75)',
        halo: '0 0 60px -12px rgba(75, 132, 240, 0.45)',
      },
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg, #4B84F0 0%, #6AA6FF 100%)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2.6s ease-in-out infinite',
        floatIn: 'floatIn 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
