# Twinstate 🧬

**A living digital twin that turns scattered student medication data into an interactive 3D patient model** — powered by Ontomorph's DTP + HOLON, with AI reasoning and simulation to explain health status, project outcomes, and support better decisions.

Built for a one-week university hackathon. Optimised for a **working, demoable product** over production-grade architecture.

---

## The idea

A student logs what they're currently taking — prescribed meds, OTC painkillers, energy drinks, supplements, herbal tonics — and how they feel. The app:

1. Builds a **digital twin** of the student.
2. Checks their combination against **HOLON's drug-interaction knowledge**.
3. Visualises risk on an **interactive 3D anatomy model** (colour-coded, warm not alarming).
4. Tracks the **pattern over a week** (cumulative, not a single snapshot).
5. Runs a **What-If simulation** — "keep this up for 2 weeks" vs "rest + hydrate" — shown as a visible change in the twin.
6. Gives one **plain-language next step**: monitor / clinic soon / seek care.

Everything is explained like a knowledgeable friend, not a pharmacology exam.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173. **No API key needed** — the app runs on a mocked service layer by default.

Try it three ways from the landing page:
- **Start my twin** → fill the 2-minute intake form.
- **See a live demo** → loads "Ada" instantly.
- **Open a persona** → Ada / Tunde / Zoe, each with a week of simulated history.

---

## ⚠️ Simulated data notice

Because this is a hackathon build with no real historical data, the following are **fabricated for demonstration only** and are clearly marked as such in the code:

- The 3 student personas and their week of history — [src/services/mock/mockData.js](src/services/mock/mockData.js)
- The drug/substance catalog and interaction rules (a small, illustrative subset — **not** a complete clinical knowledge base)
- All AI explanations and simulation projections — [src/services/mock/](src/services/mock/)

**This app is an educational demo, not medical advice, and not a diagnosis.**

---

## Architecture — swapping mock ↔ live

All data flows through **one facade**: [src/services/index.js](src/services/index.js). The UI never imports an SDK directly, so you can wire in real Ontomorph calls **without touching any component**.

```
UI (pages/components)
      │  imports only ↓
src/services/index.js          ← the facade (mock OR live)
      ├── mock/                 ← default: fully offline, demoable
      │   ├── dtpSdk.mock.js         (twin lifecycle + state)
      │   ├── holonClient.mock.js    (catalog + interaction lookup)
      │   ├── aiReasoning.mock.js    (plain-language explanations)
      │   ├── simulation.mock.js     (What-If Coach)
      │   ├── engine.js              (interaction rule evaluator)
      │   └── mockData.js            (SIMULATED personas + drug data)
      └── live/
          └── liveClients.js     ← wire-up template (matches mock signatures)
```

### Going live

1. Get a key at **developer.ontomorph.com**.
2. `cp .env.example .env.local` and fill in:
   ```
   VITE_ONTOMORPH_API_KEY=your_key_here
   VITE_DATA_SOURCE=live
   ```
3. `npm i @ontomorph/dtp-sdk @ontomorph/holon-client`
4. Implement the methods in [src/services/live/liveClients.js](src/services/live/liveClients.js) — they must return the **same shapes** as the mock clients. That's the only file you touch.

The API key is read **only** in [src/services/config.js](src/services/config.js) and flows through the service layer — it is **never** hardcoded and `.env.local` is gitignored.

---

## Screens

| Route | Screen | What it does |
|-------|--------|--------------|
| `/` | Landing | One-sentence pitch, exam-season framing, "Start My Twin" + persona demos |
| `/intake` | Intake | Fast (<2 min) entry of substances (dose/frequency), symptoms, sleep/stress |
| `/dashboard` | Twin dashboard | The 3D anatomy centrepiece + AI plain-language flags in the sidebar |
| `/interaction/:id` | Interaction detail | What's interacting, why it's risky (plain English), a safer alternative |
| `/history` | History / pattern | 7-day timeline showing cumulative risk build-up |
| `/what-if` | What-If Coach | Toggle "continue" vs "safer" — twin visibly changes state |
| `/recommendation` | Next step | Clear triage: monitor / clinic soon / seek care + safer swaps |
| `/faq` | FAQ | Plain-language answers to common health/hospital questions (public) |

### Ask-about-health chat

The twin dashboard has a grounded health chat. When a question relates to what the
student logged, it **pulls the relevant substances / symptoms / flags first** and
answers grounded in that specific data (with "Grounded in …" chips). Anything
urgent or severe (chest pain, trouble breathing, possible overdose, self-harm, or a
twin already at `urgent`) triggers a clear **seek-care** recommendation.

- **With an OpenAI key** (`VITE_OPENAI_API_KEY`) it uses the OpenAI Chat Completions
  API as a full open-domain health assistant, grounded on the twin context.
- **Without a key** a built-in offline helper answers from a small knowledge base,
  still grounded in the logged data — so the demo works with zero config.
- If an OpenAI call fails, it falls back to the offline helper (never dead-ends).

> Security: the demo calls OpenAI directly from the browser. Fine for a hackathon;
> proxy it through a small backend in production so the key never ships to clients.

### Living log (log doses over time)

The dashboard has a **"Log a dose taken today"** control. Logging a dose bumps
today's history entry, updates the current pattern, and recomputes flags / organ
risk / overall — so the 3D body, What-If simulation and History timeline all move
in sync, and it persists per account. Log a 3rd energy drink and watch the heart
flag appear. (Edited persona twins stop syncing to canonical data so your logged
doses aren't overwritten on reload.)

---

## Tech

- **React 18** (functional components + hooks) · **Vite 5**
- **Tailwind CSS 3** — warm, approachable, non-clinical design; mobile-first
- **react-router-dom 6**
- The anatomy is a **dependency-free real 3D model** ([AnatomyModel.jsx](src/components/anatomy/AnatomyModel.jsx)) — pure CSS 3D transforms give it true perspective, a depth-extruded volumetric body, drag-to-rotate + auto-rotate, and glowing organs that parallax inside it. No WebGL/three.js, so nothing extra to install and nothing to break in a live demo. It's driven by the twin's organ-risk map, so `@ontomorph/dtp-sdk` streaming a true GPU mesh is a drop-in swap on the same data.

### Design direction
- Warm risk scale — teal → amber → coral → rose. Deliberately **not** a red-alarm aesthetic; it should feel helpful to a stressed student, not scary.
- The anatomy is the emotional centrepiece: it glows, pulses on flagged organs, and animates between futures in the What-If view.
- Fully responsive — many students will view this on a phone.

---

## Project structure

```
src/
├── main.jsx                 app entry + providers
├── App.jsx                  routes (with twin guard)
├── index.css                tailwind + warm theme layers
├── context/TwinContext.jsx  state + the build-twin pipeline
├── services/                ← the swappable data layer (see above)
├── components/
│   ├── anatomy/             AnatomyModel, RiskLegend
│   ├── dashboard/           FlagCard
│   ├── layout/              AppShell, Header
│   └── ui/                  Button, Card, RiskBadge
├── pages/                   the 7 screens
└── utils/risk.js            risk palette + labels (single source of truth)
```

---

## Notes for the demo

- **Beloved** — caffeine-overload story (energy drinks + coffee + pills); most dramatic heart + What-If.
- **Ada** — high-risk liver + heart story from energy drinks + repeated paracetamol.
- **Tunde** shows the double-NSAID gut/kidney story.
- **Zoe** shows a prescription-level interaction (SSRI + tramadol) + herbal liver load.
- On the **Welcome** gate you can type a name to make a demo account, resume a saved one, or jump straight into any persona — handy for a live demo.
- The `● demo data` badge in the header flips to `● live data` automatically when `VITE_DATA_SOURCE=live`.
