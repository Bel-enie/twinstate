/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SIMULATED DATA — FOR DEMONSTRATION ONLY
 * ─────────────────────────────────────────────────────────────────────────
 *  This file fabricates a small drug/substance catalog, interaction rules,
 *  organ mappings, and student personas so the app is fully demoable WITHOUT
 *  a live Ontomorph / HOLON connection.
 *
 *  In production these come from HOLON's clinical knowledge base via
 *  @ontomorph/holon-client. Nothing here is medical advice.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Organs modelled on the 3D twin ───────────────────────────────────────
// `key` matches the id used by the anatomy renderer.
export const ORGANS = {
  brain: { key: 'brain', label: 'Brain & nervous system' },
  heart: { key: 'heart', label: 'Heart & circulation' },
  liver: { key: 'liver', label: 'Liver' },
  kidneys: { key: 'kidneys', label: 'Kidneys' },
  stomach: { key: 'stomach', label: 'Stomach & gut' },
}

// ── Substance catalog ─────────────────────────────────────────────────────
// `tags` drive the interaction engine so rules stay robust to spelling.
// category: prescription | otc | energy_drink | supplement | herbal
export const SUBSTANCES = [
  {
    id: 'paracetamol',
    label: 'Paracetamol (Panadol / acetaminophen)',
    category: 'otc',
    tags: ['hepatotoxic', 'analgesic'],
    aliases: ['acetaminophen', 'panadol', 'tylenol'],
    unit: 'mg',
    typicalDose: 500,
  },
  {
    id: 'ibuprofen',
    label: 'Ibuprofen (Advil / Brufen)',
    category: 'otc',
    tags: ['nsaid', 'analgesic', 'gastro_irritant', 'nephro_stress'],
    aliases: ['advil', 'brufen', 'nurofen'],
    unit: 'mg',
    typicalDose: 400,
  },
  {
    id: 'aspirin',
    label: 'Aspirin',
    category: 'otc',
    tags: ['nsaid', 'analgesic', 'gastro_irritant', 'blood_thinner'],
    aliases: ['acetylsalicylic acid'],
    unit: 'mg',
    typicalDose: 300,
  },
  {
    id: 'energy_drink',
    label: 'Energy drink (Red Bull / Monster / Power Horse)',
    category: 'energy_drink',
    tags: ['caffeine', 'stimulant', 'sugar'],
    aliases: ['red bull', 'monster', 'power horse', 'bullet'],
    unit: 'can',
    typicalDose: 1,
    caffeinePerUnit: 120, // mg
  },
  {
    id: 'coffee',
    label: 'Coffee',
    category: 'otc',
    tags: ['caffeine', 'stimulant'],
    aliases: ['espresso', 'nescafe'],
    unit: 'cup',
    typicalDose: 1,
    caffeinePerUnit: 95,
  },
  {
    id: 'caffeine_pills',
    label: 'Caffeine / "stay awake" pills',
    category: 'supplement',
    tags: ['caffeine', 'stimulant'],
    aliases: ['proplus', 'no-doz', 'stay awake'],
    unit: 'pill',
    typicalDose: 1,
    caffeinePerUnit: 200,
  },
  {
    id: 'tramadol',
    label: 'Tramadol',
    category: 'prescription',
    tags: ['opioid', 'cns_depressant', 'serotonergic'],
    aliases: [],
    unit: 'mg',
    typicalDose: 50,
  },
  {
    id: 'codeine',
    label: 'Codeine (cough syrup / painkiller)',
    category: 'prescription',
    tags: ['opioid', 'cns_depressant'],
    aliases: ['benylin with codeine'],
    unit: 'mg',
    typicalDose: 30,
  },
  {
    id: 'sertraline',
    label: 'Sertraline (SSRI antidepressant)',
    category: 'prescription',
    tags: ['ssri', 'serotonergic'],
    aliases: ['zoloft', 'lustral'],
    unit: 'mg',
    typicalDose: 50,
  },
  {
    id: 'alcohol',
    label: 'Alcohol',
    category: 'otc',
    tags: ['hepatotoxic', 'cns_depressant', 'dehydrating'],
    aliases: ['beer', 'spirits', 'wine'],
    unit: 'drink',
    typicalDose: 1,
  },
  {
    id: 'herbal_detox',
    label: 'Herbal detox / cleanse tonic (unregulated)',
    category: 'herbal',
    tags: ['hepatotoxic', 'herbal_unknown'],
    aliases: ['herbal tonic', 'detox tea', 'cleanse', 'bitters'],
    unit: 'dose',
    typicalDose: 1,
  },
  {
    id: 'vitamin_c',
    label: 'Vitamin C',
    category: 'supplement',
    tags: ['vitamin'],
    aliases: ['ascorbic acid'],
    unit: 'mg',
    typicalDose: 1000,
  },
  {
    id: 'multivitamin',
    label: 'Multivitamin',
    category: 'supplement',
    tags: ['vitamin'],
    aliases: [],
    unit: 'tablet',
    typicalDose: 1,
  },
]

export const SUBSTANCE_BY_ID = Object.fromEntries(SUBSTANCES.map((s) => [s.id, s]))

// ── Symptoms offered in intake ────────────────────────────────────────────
export const SYMPTOMS = [
  { id: 'headache', label: 'Headache' },
  { id: 'insomnia', label: "Can't sleep" },
  { id: 'palpitations', label: 'Racing / pounding heart' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'stomach_pain', label: 'Stomach pain' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'anxiety', label: 'Anxiety / jittery' },
  { id: 'fatigue', label: 'Exhausted / drained' },
  { id: 'dark_urine', label: 'Dark urine' },
  { id: 'no_appetite', label: 'No appetite' },
]

/**
 * ── Interaction rules ─────────────────────────────────────────────────────
 * Each rule inspects the list of logged items (already normalised with the
 * substance definition attached) plus a computed context, and returns a flag
 * when it fires. Kept declarative so the "real" HOLON response can slot in.
 *
 * severity: 'calm' | 'watch' | 'caution' | 'urgent'
 */
export const INTERACTION_RULES = [
  {
    id: 'double-hepatotoxic',
    title: 'Multiple things straining your liver',
    organ: 'liver',
    severity: 'caution',
    // fires when 2+ distinct hepatotoxic sources are present
    test: (ctx) => ctx.tagSources('hepatotoxic').length >= 2,
    substancesFrom: (ctx) => ctx.tagSources('hepatotoxic'),
    reason:
      'Paracetamol, alcohol and herbal mixes are all cleared by your liver. Stacking them makes the liver work overtime and raises the risk of damage — even at "normal" doses.',
    saferAlternative:
      'Pick one pain reliever, skip alcohol and unregulated herbal tonics while dosing, and stay well hydrated. If pain needs daily dosing for more than 2–3 days, check with the clinic.',
    reference: 'Hepatic clearance overlap — acetaminophen + ethanol + herbal hepatotoxins',
    sources: [
      { org: 'NHS', title: 'Paracetamol for adults — cautions with alcohol', url: 'https://www.nhs.uk/medicines/paracetamol-for-adults/' },
      { org: 'FDA', title: 'Acetaminophen and liver injury', url: 'https://www.fda.gov/drugs/information-drug-class/acetaminophen-information' },
    ],
  },
  {
    id: 'paracetamol-overuse',
    title: 'Paracetamol adding up over the day',
    organ: 'liver',
    severity: 'caution',
    test: (ctx) => ctx.dailyMg('paracetamol') >= 3000,
    substancesFrom: () => ['paracetamol'],
    reason:
      'The safe ceiling for most adults is about 4000 mg of paracetamol a day, and problems can start below that with other stressors. Your logged pattern is climbing toward that line.',
    saferAlternative:
      'Space doses at least 6 hours apart, cap at the label limit, and treat the underlying cause (rest, fluids) rather than re-dosing.',
    reference: 'Acetaminophen daily maximum threshold (≈4 g/day for most adults)',
    sources: [
      { org: 'NHS', title: 'Paracetamol dosage for adults', url: 'https://www.nhs.uk/medicines/paracetamol-for-adults/' },
      { org: 'FDA', title: 'Know your dose — acetaminophen', url: 'https://www.fda.gov/drugs/information-drug-class/acetaminophen-information' },
    ],
  },
  {
    id: 'caffeine-stimulant-heart',
    title: 'Too much stimulant hitting your heart',
    organ: 'heart',
    severity: 'caution',
    test: (ctx) => ctx.totalCaffeine() >= 400,
    substancesFrom: (ctx) => ctx.tagSources('caffeine'),
    reason:
      'Your combined caffeine from energy drinks, coffee and pills is above ~400 mg/day. That can cause a racing heart, higher blood pressure and the jittery-then-crash cycle — and it wrecks sleep, which is what the body actually needs during exams.',
    saferAlternative:
      'Cap caffeine at ~2 servings before noon, swap the late one for water, and protect a real sleep window. The alertness you lose to poor sleep is bigger than what caffeine buys.',
    reference: 'Caffeine cardiovascular threshold (~400 mg/day for healthy adults)',
    sources: [
      { org: 'FDA', title: 'Spilling the beans: how much caffeine is too much', url: 'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much' },
      { org: 'EFSA', title: 'Scientific opinion on the safety of caffeine', url: 'https://www.efsa.europa.eu/en/topics/topic/caffeine' },
    ],
  },
  {
    id: 'caffeine-plus-rx-stimulant',
    title: 'Energy drinks on top of a prescribed stimulant',
    organ: 'heart',
    severity: 'urgent',
    test: (ctx) =>
      ctx.tagSources('caffeine').length >= 1 && ctx.hasTag('stimulant_rx'),
    substancesFrom: (ctx) => [...ctx.tagSources('caffeine'), ...ctx.tagSources('stimulant_rx')],
    reason:
      'Layering energy drinks over a prescribed stimulant can push your heart rate and blood pressure into an unsafe zone.',
    saferAlternative: 'Drop the energy drinks entirely and talk to whoever prescribed the stimulant.',
    reference: 'Additive sympathomimetic (stimulant) load on the heart',
    sources: [
      { org: 'FDA', title: 'Caffeine and cardiovascular effects', url: 'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much' },
    ],
  },
  {
    id: 'nsaid-dehydration-kidney',
    title: 'Painkillers + dehydration straining kidneys',
    organ: 'kidneys',
    severity: 'watch',
    test: (ctx) =>
      ctx.hasTag('nsaid') && (ctx.totalCaffeine() >= 200 || ctx.hasTag('dehydrating')),
    substancesFrom: (ctx) => [...ctx.tagSources('nsaid'), ...ctx.tagSources('caffeine')],
    reason:
      'NSAIDs like ibuprofen reduce blood flow to the kidneys. Add caffeine or alcohol (both dehydrating) and skipped meals, and the kidneys take a real hit — common in exam crunch.',
    saferAlternative:
      'Hydrate before and while taking ibuprofen, take it with food, and avoid stacking it with lots of caffeine or alcohol.',
    reference: 'NSAID renal perfusion reduction + volume depletion',
    sources: [
      { org: 'NHS', title: 'Ibuprofen — kidney cautions', url: 'https://www.nhs.uk/medicines/ibuprofen-for-adults/' },
    ],
  },
  {
    id: 'double-nsaid-gut',
    title: 'Two anti-inflammatories irritating your gut',
    organ: 'stomach',
    severity: 'caution',
    test: (ctx) => ctx.tagSources('nsaid').length >= 2,
    substancesFrom: (ctx) => ctx.tagSources('nsaid'),
    reason:
      'Ibuprofen and aspirin are both NSAIDs. Together they sharply raise the risk of stomach irritation, ulcers and bleeding — especially on an empty, stressed stomach.',
    saferAlternative:
      'Use only one NSAID at a time, always with food. For simple pain, paracetamol is gentler on the stomach.',
    reference: 'Additive NSAID gastrointestinal toxicity (ulcers, bleeding)',
    sources: [
      { org: 'NHS', title: 'Ibuprofen — side effects & stomach bleeding', url: 'https://www.nhs.uk/medicines/ibuprofen-for-adults/side-effects-of-ibuprofen/' },
      { org: 'FDA', title: 'NSAIDs and gastrointestinal risks', url: 'https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/nonsteroidal-anti-inflammatory-drugs-nsaids' },
    ],
  },
  {
    id: 'opioid-cns-depressant',
    title: 'Sedating combo slowing your breathing',
    organ: 'brain',
    severity: 'urgent',
    test: (ctx) => ctx.tagSources('cns_depressant').length >= 2,
    substancesFrom: (ctx) => ctx.tagSources('cns_depressant'),
    reason:
      'Combining opioids (tramadol, codeine) with alcohol or other sedatives can dangerously slow breathing and cause deep drowsiness. This is one of the higher-risk everyday combinations.',
    saferAlternative:
      'Never mix these. If you have prescribed opioid pain relief, avoid alcohol entirely and speak to a clinician about the pain.',
    reference: 'Additive CNS / respiratory depression (opioids + sedatives)',
    sources: [
      { org: 'FDA', title: 'Serious risks combining opioids with CNS depressants', url: 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-fda-warns-about-serious-risks-and-death-when-combining-opioid-pain-or' },
    ],
  },
  {
    id: 'serotonin-stack',
    title: 'Serotonin building up too high',
    organ: 'brain',
    severity: 'caution',
    test: (ctx) => ctx.tagSources('serotonergic').length >= 2,
    substancesFrom: (ctx) => ctx.tagSources('serotonergic'),
    reason:
      'Tramadol plus an SSRI antidepressant can push serotonin too high (agitation, sweating, fast heart, tremor). Worth catching early.',
    saferAlternative:
      'Tell your prescriber you take both. A non-tramadol pain option is usually safer alongside an SSRI.',
    reference: 'Serotonin syndrome risk — SSRI + tramadol',
    sources: [
      { org: 'NHS', title: 'Tramadol — interactions with antidepressants', url: 'https://www.nhs.uk/medicines/tramadol/taking-tramadol-with-other-medicines-and-herbal-supplements/' },
    ],
  },
]

/**
 * ── Demo personas ─────────────────────────────────────────────────────────
 * Fabricated students with several days of history so History + What-If views
 * have something to show immediately. history[] is newest-last.
 *
 * Each history day: { day: 'Mon', items: [{ substanceId, dose, times }] }
 * `times` = number of times taken that day.
 */
export const PERSONAS = [
  {
    id: 'beloved',
    name: 'Beloved, 21',
    blurb: 'Board-exam crammer running on energy drinks, coffee and caffeine pills, with paracetamol for the headaches.',
    avatarTone: 'from-rose-200 to-pink-300',
    profile: { sleepHours: 3, stress: 'high' },
    symptoms: ['palpitations', 'insomnia', 'anxiety', 'headache'],
    current: [
      { substanceId: 'energy_drink', dose: 3, frequency: 'x3/day' },
      { substanceId: 'coffee', dose: 2, frequency: 'x3/day' },
      { substanceId: 'caffeine_pills', dose: 1, frequency: 'x2/day' },
      { substanceId: 'paracetamol', dose: 500, frequency: 'x2/day' },
    ],
    history: [
      { day: '6d ago', items: [{ substanceId: 'coffee', dose: 1, times: 2 }, { substanceId: 'energy_drink', dose: 1, times: 1 }] },
      { day: '5d ago', items: [{ substanceId: 'coffee', dose: 1, times: 2 }, { substanceId: 'energy_drink', dose: 2, times: 1 }] },
      { day: '4d ago', items: [{ substanceId: 'energy_drink', dose: 2, times: 2 }, { substanceId: 'coffee', dose: 1, times: 2 }, { substanceId: 'paracetamol', dose: 500, times: 1 }] },
      { day: '3d ago', items: [{ substanceId: 'energy_drink', dose: 2, times: 3 }, { substanceId: 'coffee', dose: 2, times: 2 }, { substanceId: 'caffeine_pills', dose: 1, times: 1 }] },
      { day: '2d ago', items: [{ substanceId: 'energy_drink', dose: 3, times: 3 }, { substanceId: 'coffee', dose: 2, times: 3 }, { substanceId: 'caffeine_pills', dose: 1, times: 1 }, { substanceId: 'paracetamol', dose: 500, times: 2 }] },
      { day: 'Yesterday', items: [{ substanceId: 'energy_drink', dose: 3, times: 3 }, { substanceId: 'coffee', dose: 2, times: 3 }, { substanceId: 'caffeine_pills', dose: 1, times: 2 }, { substanceId: 'paracetamol', dose: 500, times: 2 }] },
      { day: 'Today', items: [{ substanceId: 'energy_drink', dose: 3, times: 3 }, { substanceId: 'coffee', dose: 2, times: 3 }, { substanceId: 'caffeine_pills', dose: 1, times: 2 }] },
    ],
  },
  {
    id: 'ada',
    name: 'Ada, 20',
    blurb: 'Finals week. Pulling all-nighters on energy drinks and paracetamol for tension headaches.',
    avatarTone: 'from-amber-200 to-orange-300',
    profile: { sleepHours: 4, stress: 'high' },
    symptoms: ['headache', 'insomnia', 'palpitations', 'fatigue'],
    current: [
      { substanceId: 'paracetamol', dose: 1000, frequency: 'x3/day' },
      { substanceId: 'energy_drink', dose: 3, frequency: 'x3/day' },
      { substanceId: 'coffee', dose: 2, frequency: 'x2/day' },
    ],
    history: [
      { day: '6d ago', items: [{ substanceId: 'energy_drink', dose: 1, times: 1 }, { substanceId: 'coffee', dose: 1, times: 1 }] },
      { day: '5d ago', items: [{ substanceId: 'energy_drink', dose: 1, times: 2 }, { substanceId: 'paracetamol', dose: 500, times: 1 }] },
      { day: '4d ago', items: [{ substanceId: 'energy_drink', dose: 2, times: 2 }, { substanceId: 'paracetamol', dose: 1000, times: 2 }] },
      { day: '3d ago', items: [{ substanceId: 'energy_drink', dose: 2, times: 3 }, { substanceId: 'paracetamol', dose: 1000, times: 2 }, { substanceId: 'coffee', dose: 1, times: 2 }] },
      { day: '2d ago', items: [{ substanceId: 'energy_drink', dose: 3, times: 3 }, { substanceId: 'paracetamol', dose: 1000, times: 3 }] },
      { day: 'Yesterday', items: [{ substanceId: 'energy_drink', dose: 3, times: 3 }, { substanceId: 'paracetamol', dose: 1000, times: 3 }, { substanceId: 'coffee', dose: 1, times: 2 }] },
      { day: 'Today', items: [{ substanceId: 'energy_drink', dose: 3, times: 3 }, { substanceId: 'paracetamol', dose: 1000, times: 3 }] },
    ],
  },
  {
    id: 'tunde',
    name: 'Tunde, 22',
    blurb: 'Sports injury. Doubling up on ibuprofen and aspirin, washing it down with coffee, skipping meals.',
    avatarTone: 'from-teal-200 to-emerald-300',
    profile: { sleepHours: 6, stress: 'medium' },
    symptoms: ['stomach_pain', 'nausea', 'headache'],
    current: [
      { substanceId: 'ibuprofen', dose: 400, frequency: 'x3/day' },
      { substanceId: 'aspirin', dose: 300, frequency: 'x2/day' },
      { substanceId: 'coffee', dose: 3, frequency: 'x3/day' },
    ],
    history: [
      { day: '6d ago', items: [{ substanceId: 'ibuprofen', dose: 400, times: 1 }] },
      { day: '5d ago', items: [{ substanceId: 'ibuprofen', dose: 400, times: 2 }, { substanceId: 'coffee', dose: 1, times: 2 }] },
      { day: '4d ago', items: [{ substanceId: 'ibuprofen', dose: 400, times: 2 }, { substanceId: 'aspirin', dose: 300, times: 1 }] },
      { day: '3d ago', items: [{ substanceId: 'ibuprofen', dose: 400, times: 3 }, { substanceId: 'aspirin', dose: 300, times: 2 }, { substanceId: 'coffee', dose: 1, times: 3 }] },
      { day: '2d ago', items: [{ substanceId: 'ibuprofen', dose: 400, times: 3 }, { substanceId: 'aspirin', dose: 300, times: 2 }] },
      { day: 'Yesterday', items: [{ substanceId: 'ibuprofen', dose: 400, times: 3 }, { substanceId: 'aspirin', dose: 300, times: 2 }, { substanceId: 'coffee', dose: 1, times: 3 }] },
      { day: 'Today', items: [{ substanceId: 'ibuprofen', dose: 400, times: 3 }, { substanceId: 'aspirin', dose: 300, times: 2 }] },
    ],
  },
  {
    id: 'zoe',
    name: 'Zoe, 19',
    blurb: 'On a prescribed SSRI. Borrowed a friend\'s tramadol for period pain and added an unregulated herbal detox tonic.',
    avatarTone: 'from-brand-100 to-brand-400',
    profile: { sleepHours: 7, stress: 'medium' },
    symptoms: ['dizziness', 'nausea', 'anxiety'],
    current: [
      { substanceId: 'sertraline', dose: 50, frequency: 'x1/day' },
      { substanceId: 'tramadol', dose: 50, frequency: 'x2/day' },
      { substanceId: 'herbal_detox', dose: 1, frequency: 'x1/day' },
      { substanceId: 'paracetamol', dose: 500, frequency: 'x2/day' },
    ],
    history: [
      { day: '6d ago', items: [{ substanceId: 'sertraline', dose: 50, times: 1 }] },
      { day: '5d ago', items: [{ substanceId: 'sertraline', dose: 50, times: 1 }] },
      { day: '4d ago', items: [{ substanceId: 'sertraline', dose: 50, times: 1 }, { substanceId: 'paracetamol', dose: 500, times: 1 }] },
      { day: '3d ago', items: [{ substanceId: 'sertraline', dose: 50, times: 1 }, { substanceId: 'tramadol', dose: 50, times: 1 }] },
      { day: '2d ago', items: [{ substanceId: 'sertraline', dose: 50, times: 1 }, { substanceId: 'tramadol', dose: 50, times: 2 }, { substanceId: 'herbal_detox', dose: 1, times: 1 }] },
      { day: 'Yesterday', items: [{ substanceId: 'sertraline', dose: 50, times: 1 }, { substanceId: 'tramadol', dose: 50, times: 2 }, { substanceId: 'herbal_detox', dose: 1, times: 1 }, { substanceId: 'paracetamol', dose: 500, times: 2 }] },
      { day: 'Today', items: [{ substanceId: 'sertraline', dose: 50, times: 1 }, { substanceId: 'tramadol', dose: 50, times: 2 }, { substanceId: 'herbal_detox', dose: 1, times: 1 }] },
    ],
  },
]
