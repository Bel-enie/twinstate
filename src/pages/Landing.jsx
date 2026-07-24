import { useCallback, useMemo, useState } from 'react'
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
import { buildTwinStory } from '../components/marketing/twinData.js'

/**
 * The single front door, built around one product experience: a live twin in
 * the hero, a week you can scrub, a "why?" you can ask. Every figure on the
 * page is computed by the engine from a real persona's week (twinData.js).
 *
 * `Boot` in App.jsx sends users who already have a built twin to their
 * dashboard instead. The medical consent gate lives on the product routes,
 * not here, so this page can be read in full without a modal.
 */
export default function Landing() {
  const story = useMemo(() => buildTwinStory(), [])
  const [wantName, setWantName] = useState(false)

  const onBuild = useCallback(() => {
    setWantName(true)
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div id="top" className="min-h-full bg-paper text-ink">
      <Hero story={story} wantName={wantName} onBuild={onBuild} />
      <Positioning />
      <DataFusion />

      <Section id="product">
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
          <Timeline story={story} />
        </div>
      </Section>

      <WhatChanged story={story} />

      <Section id="ask">
        <Heading
          title={
            <>
              Ask <em>your</em> twin.
            </>
          }
          sub="Not a chat box. A question about your own data, answered from your own data — and simulated when the answer lies in the future."
        />
        <div className="mt-12">
          <AskTwin story={story} />
        </div>
      </Section>

      <Evidence story={story} />
      <Trust />
      <FinalCta onBuild={onBuild} />
      <SiteFooter />
    </div>
  )
}
