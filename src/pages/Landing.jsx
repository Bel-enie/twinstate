import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Aurora from '../components/landing/ui/Aurora.jsx'
import Nav from '../components/landing/Nav.jsx'
import Hero from '../components/landing/Hero.jsx'
import SubstanceMarquee from '../components/landing/SubstanceMarquee.jsx'
import TwinBento from '../components/landing/TwinBento.jsx'
import Moments from '../components/landing/Moments.jsx'
import HowItWorks from '../components/landing/HowItWorks.jsx'
import EarlyAccess from '../components/landing/EarlyAccess.jsx'
import Footer from '../components/landing/Footer.jsx'
import { buildTwinStory } from '../components/landing/twinData.js'
import { useTwin } from '../context/TwinContext.jsx'
import { listProfiles } from '../services/storage.js'

/**
 * The front door, rebuilt in a bold gradient bento style (Magic UI-school
 * primitives under components/landing/ui). The background is pure CSS — no
 * WebGL field — and every product number on the page is still computed by the
 * real rule engine from Ada's week (twinData.js).
 *
 * `Boot` in App.jsx sends users who already have a built twin straight to
 * their dashboard. The consent gate lives on the product routes, not here.
 */
export default function Landing() {
  const navigate = useNavigate()
  const { resumeAccount, loadPersona } = useTwin()
  const story = useMemo(() => buildTwinStory(), [])
  const [wantName, setWantName] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const latest = useMemo(() => listProfiles()[0] || null, [])

  const onBuild = useCallback(() => {
    setWantName(true)
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const onResume = useCallback(
    (key) => {
      const { ok, hasTwin } = resumeAccount(key)
      if (ok) navigate(hasTwin ? '/dashboard' : '/intake')
    },
    [resumeAccount, navigate]
  )

  const onDemo = useCallback(async () => {
    setDemoBusy(true)
    const ok = await loadPersona(story.persona.id)
    if (ok) navigate('/dashboard')
    else setDemoBusy(false)
  }, [loadPersona, story.persona.id, navigate])

  return (
    <div id="top" className="relative min-h-full overflow-x-clip bg-paper text-ink">
      <Aurora />
      <div className="relative">
        <Nav latest={latest} onResume={onResume} onBuild={onBuild} />
        <Hero story={story} wantName={wantName} onBuild={onBuild} demoBusy={demoBusy} onDemo={onDemo} />
        <SubstanceMarquee />
        <TwinBento story={story} demoBusy={demoBusy} onDemo={onDemo} />
        <Moments />
        <HowItWorks />
        <EarlyAccess onBuild={onBuild} />
        <Footer />
      </div>
    </div>
  )
}
