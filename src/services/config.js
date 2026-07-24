/**
 * Central config. Reads Vite env vars (see .env.example).
 * The API key is read here ONLY — never hardcode it in components.
 */
export const config = {
  apiKey: import.meta.env.VITE_ONTOMORPH_API_KEY || '',
  apiUrl: import.meta.env.VITE_ONTOMORPH_API_URL || 'https://api.ontomorph.com/v1',
  // 'mock' (default) or 'live'
  dataSource: (import.meta.env.VITE_DATA_SOURCE || 'mock').toLowerCase(),

  // OpenAI powers the "Ask about health" chat.
  //
  // PRODUCTION: set VITE_CHAT_PROXY_URL to the backend proxy (server/proxy.mjs).
  // The key lives ONLY on that server and never ships to the browser.
  //
  // DEV-ONLY fallback: VITE_OPENAI_API_KEY calls OpenAI straight from the
  // browser. Convenient for local demos, but the key is bundled and public —
  // never use it for a deployed/shared build. Without either, a grounded
  // offline mock answers so the demo always works.
  chatProxyUrl: import.meta.env.VITE_CHAT_PROXY_URL || '',
  openaiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  openaiModel: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',

  // HOLON clinical-knowledge API (@ontomorph/holon-client). Powers REAL drug
  // interactions + concept resolution when a holon_… key is present. This is
  // gated on its own key (NOT VITE_DATA_SOURCE) because HOLON needs no patient
  // grant — so we use real HOLON while the twin lifecycle stays mock.
  // Accept the HOLON key from its own var, or from VITE_ONTOMORPH_API_KEY when
  // that holds a holon_… key (so either placement in .env.local works).
  holonKey:
    import.meta.env.VITE_HOLON_API_KEY ||
    ((import.meta.env.VITE_ONTOMORPH_API_KEY || '').startsWith('holon_')
      ? import.meta.env.VITE_ONTOMORPH_API_KEY
      : ''),
  // Confirmed live base URL (holon.ontomorph.com does not resolve; the -api host does).
  holonApiUrl: import.meta.env.VITE_HOLON_API_URL || 'https://holon-api.ontomorph.com',
  // DTP twin-core key (dtp_live_/dtp_test_) — optional, for future twin calls.
  dtpKey: import.meta.env.VITE_DTP_API_KEY || '',
}

export const isLive = config.dataSource === 'live'
export const hasChatProxy = Boolean(config.chatProxyUrl)
export const hasOpenAI = Boolean(config.openaiKey)
// True whenever a real LLM answers (proxy preferred over direct browser key).
export const hasAIChat = hasChatProxy || hasOpenAI
// True when a real HOLON key is configured → use live clinical knowledge.
export const hasHolon = Boolean(config.holonKey)
