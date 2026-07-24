# Twinstate — your living health twin

**One-line:** Twinstate turns the scattered things a student takes — prescriptions,
painkillers, energy drinks, supplements, herbal tonics — into a living 3D digital
twin, screens the combination against **HOLON's clinical drug-interaction
knowledge**, and explains in plain language what it's doing to their body.

**Who it's for:** university students in exam season — the population most likely to
stack caffeine, paracetamol, ibuprofen and "study aids" without realising the
combined load. Secondarily, the campus health centre that sees the fallout.

**Built for:** The Ontomorph Hackathon (19–25 July 2026, OAU).

---

## What it does

1. **Build a twin** — the student logs what they currently take (rough doses are
   fine). Anything not in the starter catalogue is **resolved live against HOLON's
   5.3M concepts** ("Augmentin" → the real drug concept), with AI supplying the
   interaction tags that colour the body.
2. **See the body react** — an interactive **3D holographic anatomy** colours each
   organ by risk, with a beating heart, breathing chest and a scanning beam. Tap an
   organ to focus its flags.
3. **Real drug-safety check** — the full list is screened with
   `HOLON.interactions.checkList()`; each known interaction (severity, mechanism,
   clinical effect, management, evidence grade) is mapped onto the organ it affects.
4. **AI-calculated stats** — organ scores, a 0–100 body-stress index, and the
   plain-language reasoning are computed by AI over the student's actual data
   (with a deterministic engine as an instant baseline + fallback).
5. **What-If coach** — two futures for the same body ("keep this pattern" vs "rest +
   hydrate") projected over the coming weeks.
6. **Ask-about-health chat** — grounded in the student's twin, with a hard safety
   rule that routes anything urgent to real care.

---

## Which parts of the platform it uses

| Platform capability | How Twinstate uses it |
|---|---|
| **HOLON clinical knowledge** | Real `@ontomorph/holon-client`: `concepts.search()` resolves every substance to a clinical concept; `interactions.checkList()` screens the whole medication list against HOLON's interaction knowledge base. Severity, mechanism, clinical effect, management and evidence grade drive our flags and citations. |
| **3D anatomy** | A dependency-free volumetric 3D twin is the emotional centrepiece — organs are coloured and animated by the risk HOLON + AI compute. |
| **AI reasoning** | AI reasons over the twin's data to calculate the organ scores, body-stress index and explanations, and powers the grounded health chat. |
| **Digital twin model** | The app is organised exactly like the platform's twin: a body sliced into systems (brain, heart, liver, kidneys, stomach), each carrying the events (doses) and findings (flags) pinned to it. |

HOLON is integrated behind the app's service layer and activates with a `holon_…`
key (`VITE_HOLON_API_KEY`) — no patient grant required, so real clinical knowledge
drives a self-service consumer tool. The DTP twin-core (grant-scoped patient data)
is stubbed behind the same interface and ready to connect.

---

## Judging criteria, directly

- **Innovation** — a *living* twin: not a form and a risk score, but a 3D body that
  visibly reacts, with two projected futures and AI that calculates the numbers from
  your own inputs.
- **Clinical value** — targets a real, common harm (student self-medication /
  polypharmacy) with a genuine drug-interaction check and a clear "what should I do
  now" path to care.
- **Execution** — works end-to-end today, with a medical-safety framework (consent
  gate, disclaimers, emergency routing), an error boundary, and graceful fallbacks so
  a flaky network never breaks the demo.
- **Use of the platform** — real HOLON interactions + concept resolution, a 3D
  anatomy twin, and AI reasoning, integrated behind one clean service layer.

---

## Run it

```bash
npm install
cp .env.example .env.local     # then add your keys to .env.local (gitignored)
npm run dev                    # http://localhost:5173
```

Keys (all optional — the app runs fully on mocks with none):

- `VITE_HOLON_API_KEY` — a `holon_…` key → **real HOLON drug interactions**.
- `VITE_OPENAI_API_KEY` **or** `VITE_CHAT_PROXY_URL` (+ `npm run proxy`) → AI stats + chat.

Without any key it still runs on a grounded offline engine, so the demo never
dead-ends.

## Not medical advice

Twinstate is an educational tool, not a medical device. It does not diagnose or make
prescription decisions. In an emergency, contact local emergency services.
