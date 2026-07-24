import { useNavigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell.jsx'
import AnatomyModel from '../components/anatomy/AnatomyModel.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { PERSONAS } from '../services/mock/mockData.js'

// A calm preview state for the hero anatomy.
const PREVIEW_RISK = {
  heart: { severity: 'watch' },
  liver: { severity: 'caution' },
  brain: { severity: 'calm' },
}

export default function Landing() {
  const navigate = useNavigate()
  const { loadPersona, status, session } = useTwin()
  const firstName = session?.name?.split(',')[0]

  const tryPersona = async (id) => {
    const ok = await loadPersona(id)
    if (ok) navigate('/dashboard')
  }

  return (
    <AppShell>
      {/* Hero */}
      <section className="grid items-center gap-6 pb-3 pt-4 md:grid-cols-2 md:gap-10 md:pb-4 md:pt-8">
        <div className="animate-floatIn">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {firstName ? `Hi ${firstName} 👋 — let's build your twin` : 'Exam-season self-medication, made visible'}
          </span>
          <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            See what your meds, energy drinks &amp; supplements are doing to your body{' '}
            <span className="text-brand-500">— as a living twin.</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-slate-soft">
            Log what you're taking. We build a digital twin of you, check it against real clinical
            drug-interaction knowledge, and show the risk on an interactive 3D body — in plain
            language, in under two minutes.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Button to="/intake" size="lg" className="w-full">
                Start my twin →
              </Button>
              <p className="mt-1.5 text-center text-xs text-slate-soft sm:text-left">
                Log what <span className="font-semibold text-ink/70">you</span> actually take — about 2 min.
              </p>
            </div>
            <div className="flex-1">
              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={() => tryPersona('beloved')}
                disabled={status === 'building'}
              >
                {status === 'building' ? 'Loading…' : 'See a demo →'}
              </Button>
              <p className="mt-1.5 text-center text-xs text-slate-soft sm:text-left">
                Open a <span className="font-semibold text-ink/70">pre-filled example</span> student instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Anatomy hero */}
        <div className="relative order-first md:order-none">
          <div className="stage-backdrop mx-auto flex aspect-[3/4] max-w-xs items-center justify-center rounded-[2rem] p-4 shadow-soft sm:max-w-sm">
            <AnatomyModel organRisk={PREVIEW_RISK} />
          </div>
          <p className="mt-2 text-center text-xs text-slate-soft">Drag to rotate your twin</p>
        </div>
      </section>

      {/* Problem framing — flows straight out of the hero */}
      <section className="grid gap-3 pb-6 pt-1 sm:grid-cols-3">
        {[
          {
            t: 'The stack is invisible',
            d: 'Paracetamol for the headache, three energy drinks for the all-nighter, a herbal "detox" tonic — each feels harmless alone.',
          },
          {
            t: 'The risk is cumulative',
            d: "It's not one dose, it's the pattern over a week. Livers, kidneys and hearts feel the total.",
          },
          {
            t: 'Nobody explains it simply',
            d: 'Interaction checkers read like a pharmacology exam. Your twin explains it like a friend who happens to know medicine.',
          },
        ].map((c) => (
          <Card key={c.t} className="p-5">
            <h3 className="font-bold">{c.t}</h3>
            <p className="mt-2 text-sm text-slate-soft">{c.d}</p>
          </Card>
        ))}
      </section>

      {/* Demo personas */}
      <section className="py-6">
        <h2 className="text-lg font-bold">Or step into a student's twin</h2>
        <p className="text-sm text-slate-soft">Sample students, each with a week of simulated history — one click to explore.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PERSONAS.map((p) => (
            <Card key={p.id} className="flex flex-col p-5">
              <div className={`mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br ${p.avatarTone}`} />
              <h3 className="font-bold">{p.name}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-soft">{p.blurb}</p>
              <Button
                variant="soft"
                size="sm"
                className="mt-4 w-full"
                onClick={() => tryPersona(p.id)}
                disabled={status === 'building'}
              >
                Open {p.name.split(',')[0]}'s twin
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
