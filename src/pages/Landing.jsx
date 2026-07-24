import { useCallback, useEffect, useMemo, useState } from 'react'
import Atmosphere from '../components/marketing/Atmosphere.jsx'
import Hero from '../components/marketing/Hero.jsx'
import Timeline from '../components/marketing/Timeline.jsx'
import AskTwin from '../components/marketing/AskTwin.jsx'
import {
  Section,
  Heading,
  Positioning,
  DataFusion,
  WhatChanged,
  Evidence,
  Trust,
  FinalCta,
  SiteFooter,
} from '../components/marketing/Sections.jsx'
import { buildTwinStory, flagOnOrgan } from '../components/marketing/twinData.js'
import { initSpecularButtons } from '../components/marketing/specular.js'

/**
 * The single front door, built around one product experience: a live 3D twin
 * in the hero, a week you can scrub, a "why?" you can ask, evidence any flag
 * opens into. Every figure on the page is computed by the engine from a real
 * persona's week (twinData.js). One fixed WebGL canvas draws a pearl-grey
 * glass-ribbon field behind everything (Atmosphere.jsx, tuned via ATMOSPHERE);
 * the page is transparent above it, in an isolated wrapper with explicit stacking.
 *
 * `Boot` in App.jsx sends users who already have a built twin to their
 * dashboard instead. The medical consent gate lives on the product routes,
 * not here, so this page can be read in full without a modal.
 */
export default function Landing() {
  const story = useMemo(() => buildTwinStory(), [])
  const [wantName, setWantName] = useState(false)
  const [flagId, setFlagId] = useState(null)
  const [organ, setOrgan] = useState(null)

  useEffect(() => initSpecularButtons(), [])

  const onBuild = useCallback(() => {
    setWantName(true)
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  /** Any flag, anywhere → the evidence panel. */
  const selectFlag = useCallback((id) => {
    if (!id) return
    setFlagId(id)
    document.getElementById('evidence')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  /** An organ in either 3D twin → its flag's evidence (if it has one). */
  const selectOrgan = useCallback(
    (key) => {
      setOrgan(key)
      if (!key) return
      const f = flagOnOrgan(story, key)
      if (f) selectFlag(f.id)
    },
    [story, selectFlag]
  )

  return (
    <div className="landing min-h-full">
      <Atmosphere />
      <div id="top" className="relative z-[1] min-h-full text-ink">
        <Hero
          story={story}
          wantName={wantName}
          onBuild={onBuild}
          onSelectFlag={selectFlag}
          selectedOrgan={organ}
          onSelectOrgan={selectOrgan}
        />
        <Positioning />
        <DataFusion />

        <Section id="product" mood="product">
          <Heading
            eyebrow="Product"
            title={
              <>
                Your twin changes <em>when you do.</em>
              </>
            }
            sub={`Drag across ${story.firstName}'s week. The body, the flags and the figures are recomputed for each day by the same engine that runs the app — not an animation.`}
          />
          <div className="mt-12">
            <Timeline story={story} onSelectFlag={selectFlag} selectedOrgan={organ} onSelectOrgan={selectOrgan} />
          </div>
        </Section>

        <WhatChanged story={story} />

        <Section id="ask" mood="ask">
          <Heading
            title={
              <>
                Ask <em>your</em> twin.
              </>
            }
            sub="Not a chat box. A question about your own data, answered from your own data — and simulated when the answer lies in the future."
          />
          <div className="mt-12">
            <AskTwin story={story} onSelectFlag={selectFlag} />
          </div>
        </Section>

        <Evidence story={story} flagId={flagId} onSelectFlag={selectFlag} />
        <Trust />
        <FinalCta onBuild={onBuild} />
        <SiteFooter />
      </div>
    </div>
  )
}
