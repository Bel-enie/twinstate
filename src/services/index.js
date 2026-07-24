/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SERVICE LAYER FACADE
 * ─────────────────────────────────────────────────────────────────────────
 *  The ONLY module the UI imports for data. It hides whether we're running
 *  against the mock clients or the live Ontomorph SDK. Swap the whole app to
 *  real calls by setting VITE_DATA_SOURCE=live (and implementing live/).
 *
 *  Grouped by capability:
 *    twin       -> @ontomorph/dtp-sdk         (twin lifecycle + state)
 *    holon      -> @ontomorph/holon-client    (catalog + interactions)
 *    ai         -> Ontomorph AI reasoning     (plain-language explanations)
 *    simulation -> Ontomorph simulation       (What-If Coach)
 * ─────────────────────────────────────────────────────────────────────────
 */
import { isLive, hasOpenAI, hasChatProxy, hasAIChat, hasHolon } from './config.js'

import { dtpSdkMock } from './mock/dtpSdk.mock.js'
import { holonClientMock } from './mock/holonClient.mock.js'
import { holonLive } from './live/holonLive.js'
import { aiReasoningMock } from './mock/aiReasoning.mock.js'
import { simulationMock } from './mock/simulation.mock.js'
import { healthChatMock } from './mock/healthChat.mock.js'
import { openaiChat } from './openai/openaiChat.js'
import { chatProxy } from './openai/chatProxy.js'
import { aiAnalysis } from './analysis/aiAnalysis.js'
import { substanceResolver } from './analysis/substanceResolver.js'
import { aiReasoning } from './openai/aiReasoning.js'

import { liveDtp, liveHolon, liveAi, liveSimulation } from './live/liveClients.js'

const dtp = isLive ? liveDtp : dtpSdkMock
// HOLON is gated on its OWN key, not VITE_DATA_SOURCE — it needs no patient
// grant, so we use real clinical knowledge while the twin lifecycle stays mock.
const holonClient = hasHolon ? holonLive : isLive ? liveHolon : holonClientMock
// AI reasoning (recommend) uses OpenAI when available, mock otherwise —
// aiReasoning handles that fallback internally.
const ai = isLive ? liveAi : aiReasoning
const sim = isLive ? liveSimulation : simulationMock

export const twin = {
  createTwin: (args) => dtp.createTwin(args),
  getTwinState: (args) => dtp.getTwinState(args),
}

export const holon = {
  getCatalog: () => holonClient.getCatalog(),
  search: (q) => holonClient.search(q),
  lookupInteractions: (items) => holonClient.lookupInteractions(items),
  // Resolve a substance not in the catalog (HOLON → AI → generic).
  resolveSubstance: (name) => substanceResolver.resolve(name),
  canResolveWithAI: substanceResolver.hasAI,
}

export const reasoning = {
  explainFlag: (flag) => ai.explainFlag(flag),
  summarizeTwin: (args) => ai.summarizeTwin(args),
  recommend: (args) => ai.recommend(args),
}

export const simulation = {
  simulate: (args) => sim.simulate(args),
}

// AI-calculated twin stats (organ scores, body index, flags, projections).
// AI-primary with an automatic deterministic-engine fallback baked in.
export const analysis = {
  assess: (args) => aiAnalysis.assess(args),
  project: (args) => aiAnalysis.project(args),
  isAI: aiAnalysis.isAI,
}

// Health chat, in order of preference:
//   1. Secure backend proxy  (production — key stays server-side)
//   2. Direct browser OpenAI  (dev convenience — key is bundled/public)
//   3. Grounded offline mock  (no key — demo still works)
const chatImpl = hasChatProxy ? chatProxy : hasOpenAI ? openaiChat : healthChatMock
export const chat = {
  ask: (args) => chatImpl.ask(args),
  isAI: hasAIChat,
  secure: hasChatProxy, // true when no secret is exposed to the browser
}

export { isLive, hasOpenAI, hasChatProxy, hasAIChat, hasHolon }
export const dataSourceLabel = isLive ? 'live' : hasHolon ? 'holon' : 'mock'
