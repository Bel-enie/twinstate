import StickyStack from './ui/StickyStack.jsx'
import ProblemCard from './story/ProblemCard.jsx'
import WeekCard from './story/WeekCard.jsx'
import AskCard from './story/AskCard.jsx'

/** The product story as three sticky cards: the problem, the living week, the questions. */
export default function StoryStack({ story }) {
  return (
    <section id="story" aria-label="Why a twin" className="mx-auto max-w-[1100px] scroll-mt-24 px-5 py-16 sm:px-8">
      <StickyStack>
        <ProblemCard />
        <WeekCard story={story} />
        <AskCard story={story} />
      </StickyStack>
    </section>
  )
}
