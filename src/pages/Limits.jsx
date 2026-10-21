import { CheckCircle2, Code2, Database, Lock, Sparkles, XCircle } from 'lucide-react'
import AppShell from '../components/layout/AppShell.jsx'
import Panel from '../components/ui/Panel.jsx'
import Button from '../components/ui/Button.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useTwin } from '../context/TwinContext.jsx'
import { INTERACTION_RULES, SUBSTANCES } from '../services/mock/mockData.js'
import { hasHolon } from '../services/config.js'
import { privacyLine, recipients } from '../services/privacy.js'

const REPO = 'https://github.com/Bel-enie/twinstate'

const CHECKS = [
  `${SUBSTANCES.length} common substances students take — painkillers, energy drinks, coffee, a few prescriptions, supplements and herbal tonics.`,
  `${INTERACTION_RULES.length} interaction rules, each tied to public guidance (NHS, FDA and similar), such as paracetamol over the daily line or two NSAIDs together.`,
  'How much you take in a day, added up across everything you logged — not one dose at a time.',
  'How your week built up, day by day.',
]

const DOESNT = [
  'Your body: weight, age, kidney or liver function, pregnancy, allergies or other conditions.',
  'Timing: when you took each dose, or how long it stays in your system.',
  'Anything you did not log, including ingredients hidden inside combination products unless you add them.',
  'Rare or newly discovered interactions outside its rule set.',
  'Diagnosis. It cannot tell you what is wrong, only what in your log matches a known risk.',
]

export default function Limits() {
  const { hasTwin } = useTwin()
  const sent = recipients()

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="How it works, and what it can’t do"
          sub="Twinstate is a hackathon-stage educational tool. Here is exactly what it checks, what it ignores, and where your data goes."
        />

        <div className="space-y-5">
          <Panel icon={CheckCircle2} title="What it checks">
            <ul className="space-y-2 text-sm leading-relaxed">
              {CHECKS.map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-risk-calm" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel icon={XCircle} title="What it does not model">
            <ul className="space-y-2 text-sm leading-relaxed">
              {DOESNT.map((t) => (
                <li key={t} className="flex gap-2">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-risk-caution" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-2xl border border-risk-watch/40 bg-risk-watch/10 p-3 text-sm">
              When something can’t be identified, Twinstate says <strong>“Not checked”</strong> instead of showing it as
              safe. No flag never means “you’re fine”, only that none of its rules matched.
            </p>
          </Panel>

          <Panel icon={Sparkles} title="The score and the AI">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                The <strong>interaction load</strong> (0–100) is worked out by fixed rules from what you logged, so the
                same log always gives the same number. It is for comparing your own days, not a medical measurement.
              </p>
              <p>
                When AI is switched on, it can only <em>raise</em> a warning and write the plain-language explanations.
                It never lowers a warning or sets the numbers. Flags it adds are labelled “AI-reviewed”.
              </p>
            </div>
          </Panel>

          <Panel icon={Database} title="What HOLON is">
            <p className="text-sm leading-relaxed">
              HOLON is Ontomorph’s clinical drug-interaction database. With a HOLON key, Twinstate looks up your
              substances there for real interaction data. {hasHolon ? 'It is switched on here.' : 'It is not switched on in this version, so the built-in rules are used.'}
            </p>
          </Panel>

          <Panel icon={Lock} title="Where your data goes">
            <p className="text-sm leading-relaxed">{privacyLine()}</p>
            {sent.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {sent.map((r) => (
                  <li key={r.who}>
                    <strong>{r.who}</strong> receives {r.what}.
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm leading-relaxed">
              You can export everything Twinstate saved, or delete all of it, from your account menu at any time.
            </p>
          </Panel>

          <div className="flex flex-wrap gap-2">
            <Button href={REPO} target="_blank" rel="noopener noreferrer" variant="ghost">
              <Code2 className="h-4 w-4" aria-hidden="true" /> Read the code on GitHub
            </Button>
            <Button to={hasTwin ? '/dashboard' : '/'}>{hasTwin ? 'Back to my twin' : 'Back to Twinstate'}</Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
