import { useState } from 'react'
import AppShell from '../components/layout/AppShell.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import { useTwin } from '../context/TwinContext.jsx'

const FAQ = [
  {
    group: 'Medicines 101',
    items: [
      {
        q: "What's the difference between prescription, over-the-counter, and supplements?",
        a: 'Prescription meds are given to you by a clinician for your specific situation. Over-the-counter (OTC) ones — like paracetamol or ibuprofen — you can buy without a prescription, but they still have real limits. Supplements (vitamins, herbal tonics) are the least regulated, so "you can buy it freely" does not mean "it can\'t affect you".',
      },
      {
        q: 'What does "take with food" actually mean, and why?',
        a: 'It means take it during or just after a meal or snack, not on an empty stomach. For painkillers like ibuprofen, food creates a buffer that lowers the chance of stomach irritation or ulcers.',
      },
      {
        q: "What's the difference between a symptom and a side effect?",
        a: 'A symptom is something your body is doing because of an illness or problem (a headache, nausea). A side effect is something a medicine causes on top of its main job (e.g. drowsiness from a cough syrup). Twinstate helps you notice when a "symptom" might actually be a side effect of what you\'re taking.',
      },
    ],
  },
  {
    group: 'Interactions & safety',
    items: [
      {
        q: 'What is a "drug interaction"?',
        a: "It's when two or more things you take change how each other work in your body — sometimes making effects stronger, weaker, or adding up in a harmful way. It isn't only about prescription drugs: energy drinks, alcohol and herbal tonics all count.",
      },
      {
        q: 'Can I take paracetamol and ibuprofen at the same time?',
        a: 'They work differently and are often used together safely for short periods — but each has its own daily limit, and doubling up on two of the SAME type (e.g. ibuprofen + aspirin) is the risky part. If you\'re reaching for painkillers every day, that\'s the sign to get checked rather than keep dosing.',
      },
      {
        q: 'How much paracetamol is too much in a day?',
        a: 'For most adults the ceiling is about 4000 mg (often eight 500 mg tablets) in 24 hours — and problems can start below that if you also drink alcohol or take other liver-stressing things. Space doses at least 6 hours apart and count everything, including combined cold/flu sachets that also contain paracetamol.',
      },
      {
        q: 'Why do energy drinks make my heart race?',
        a: 'They\'re packed with caffeine, a stimulant. Above roughly 400 mg of caffeine a day (a few energy drinks plus coffee gets there fast) you can feel a pounding or racing heart, jitteriness and broken sleep — which is the opposite of what you need in exam season.',
      },
      {
        q: 'Are herbal or "natural" supplements automatically safe?',
        a: 'No. "Natural" doesn\'t mean harmless — some herbal and "detox" tonics are hard on the liver, and because they\'re unregulated, the actual contents and strength can vary a lot. Always tell a clinician about them, just like any medicine.',
      },
      {
        q: 'Is it bad to mix alcohol with my medicines?',
        a: 'Often, yes. Alcohol adds to liver strain (with paracetamol) and to drowsiness (with painkillers like tramadol or codeine), which can be dangerous. When in doubt, keep them apart and ask.',
      },
    ],
  },
  {
    group: 'When to get help',
    items: [
      {
        q: 'When should I go to the health centre instead of waiting it out?',
        a: 'Go if a symptom is severe, getting worse, lasts longer than you\'d expect, or you\'re relying on painkillers daily just to function. Go urgently (or call emergency services) for chest pain, trouble breathing, fainting, confusion, a possible overdose, or thoughts of harming yourself.',
      },
      {
        q: 'Why does the doctor always ask what else I\'m taking?',
        a: "Because the risk is usually in the combination, not one item. Everything you take — prescriptions, OTC, energy drinks, supplements — helps them spot interactions and pick something safe. Twinstate is basically that list, ready to show them.",
      },
      {
        q: 'What does it mean when my urine is very dark?',
        a: 'Often it just means you\'re dehydrated — drink water and see if it clears. But persistently dark urine can also signal your liver or kidneys are under strain, so if it doesn\'t improve with fluids, get it checked.',
      },
    ],
  },
  {
    group: 'Using Twinstate',
    items: [
      {
        q: 'What do the colours on my twin mean?',
        a: 'They\'re a warm scale, not an alarm: teal = all clear, amber = keep an eye on it, coral = time to change something, rose = act on it soon. Each highlighted organ links to a plain-language explanation of why it\'s flagged.',
      },
      {
        q: 'Is Twinstate medical advice?',
        a: 'No — it\'s a way to see and understand what you\'re taking, grounded in reference data. It helps you ask better questions and know when to get help, but a real clinician is always the final word.',
      },
    ],
  },
]

function Item({ item, open, onToggle }) {
  return (
    <div className="border-b border-ink/5 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-semibold">{item.q}</span>
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cream text-slate-soft transition-transform ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      {open && <p className="pb-4 pr-10 text-sm leading-relaxed text-slate-soft">{item.a}</p>}
    </div>
  )
}

export default function FAQPage() {
  const { hasTwin } = useTwin()
  const [open, setOpen] = useState('0-0')

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">Questions people actually ask</h1>
          <p className="text-sm text-slate-soft">
            Plain-language answers to the things students often wonder about — the kind of stuff you'd
            ask at the clinic desk.
          </p>
        </div>

        <div className="space-y-5">
          {FAQ.map((section, si) => (
            <Card key={section.group} className="p-5">
              <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-600">
                {section.group}
              </h2>
              <div>
                {section.items.map((item, ii) => {
                  const id = `${si}-${ii}`
                  return (
                    <Item
                      key={id}
                      item={item}
                      open={open === id}
                      onToggle={() => setOpen((cur) => (cur === id ? null : id))}
                    />
                  )
                })}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-brand-100 bg-brand-50/60 p-5 text-center">
          <p className="text-sm font-semibold">Still wondering about something specific to you?</p>
          <p className="mt-1 text-sm text-slate-soft">
            Ask the health helper right on your twin — it grounds answers in what you've logged.
          </p>
          <Button to={hasTwin ? '/dashboard' : '/'} className="mt-3">
            {hasTwin ? 'Open my twin' : 'Build my twin'}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
