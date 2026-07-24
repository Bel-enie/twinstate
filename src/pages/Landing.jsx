import HeroCard from '../components/marketing/HeroCard.jsx'
import {
  ProblemStrip,
  InsightsSection,
  StatsBento,
  SafetySection,
  FaqSection,
  CtaBand,
  SiteFooter,
} from '../components/marketing/Sections.jsx'

/**
 * The single front door — a long-scroll page that both pitches Twinstate and
 * lets you straight into it.
 *
 * Structure: a dark hero card floating on the light page, with the product
 * mockup hanging off its bottom edge; light editorial sections; a dark CTA
 * band and a dark footer card that mirrors the hero. `Boot` in App.jsx sends
 * users who already have a built twin to their dashboard instead.
 *
 * ProblemStrip carries the top padding that makes room for the mockup's
 * overlap (see HeroCard.jsx) — keep the two in step if either changes.
 */
export default function Landing() {
  return (
    <div id="top" className="min-h-full bg-paper text-ink">
      <HeroCard />
      <ProblemStrip />
      <InsightsSection />
      <StatsBento />
      <SafetySection />
      <FaqSection />
      <CtaBand />
      <SiteFooter />
    </div>
  )
}
