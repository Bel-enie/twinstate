import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { twin as twinApi, holon, reasoning, analysis, isLive } from '../services/index.js'
import { PERSONAS, SUBSTANCE_BY_ID } from '../services/mock/mockData.js'
import { frequencyToTimes, deriveTwinState, computeBodyIndex } from '../services/mock/engine.js'
import {
  getCurrentKey,
  setCurrentKey,
  clearCurrentKey,
  getProfile,
  saveProfile,
  userKey,
  personaKeyOf,
} from '../services/storage.js'

const TwinContext = createContext(null)

const EMPTY = {
  twin: null,
  items: [],
  symptoms: [],
  notes: '',
  history: [],
  flags: [],
  organRisk: {},
  overall: 'calm',
  status: 'idle',
}

/** Build a light synthetic 7-day history for custom users so History isn't empty. */
function synthHistory(items) {
  const days = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today']
  return days.map((day, i) => {
    const ramp = (i + 2) / days.length // usage grows toward today
    return {
      day,
      items: items.map((it) => ({
        substanceId: it.substanceId,
        dose: it.dose,
        times: Math.max(1, Math.round(frequencyToTimes(it.frequency) * ramp)),
      })),
    }
  })
}

/**
 * For a persona profile, always re-pull the canonical inputs from PERSONAS so a
 * saved persona reflects the current substance list / history — never a snapshot
 * from before the data changed. Custom (typed-name) profiles pass through as-is.
 */
function effectiveProfile(p) {
  // Once a persona twin has been edited (e.g. the student logged a dose), stop
  // overriding it with canonical persona data — respect their saved changes.
  if (p?.personaId && !p.edited) {
    const per = PERSONAS.find((x) => x.id === p.personaId)
    if (per) {
      return {
        ...p,
        items: per.current,
        history: per.history,
        notes: p.notes || per.blurb,
        symptoms: per.symptoms,
      }
    }
  }
  return p
}

/**
 * Resolve the derived twin state for a stored profile.
 * In mock mode we RECOMPUTE from the raw `items` so a reload always reflects the
 * current substance list / interaction rules (never a stale saved snapshot).
 * In live mode the flags come from the API, so we trust the stored snapshot.
 */
function resolveDerived(p) {
  if (!isLive && p.items?.length) return deriveTwinState(p.items)
  return {
    flags: p.flags || [],
    organRisk: p.organRisk || {},
    overall: p.overall || 'calm',
  }
}

/** Read the signed-in account (if any) straight from storage — runs once, before first paint. */
function readInitial() {
  const key = getCurrentKey()
  if (!key) return { session: null, ...EMPTY }
  const p = getProfile(key)
  if (!p) return { session: null, ...EMPTY }

  const session = { key, name: p.name, personaId: p.personaId || null }
  if (p.twin) {
    const eff = effectiveProfile(p)
    return {
      session,
      twin: eff.twin,
      items: eff.items || [],
      symptoms: eff.symptoms || [],
      notes: eff.notes || '',
      history: eff.history || [],
      ...resolveDerived(eff),
      edited: Boolean(p.edited),
      status: 'ready',
    }
  }
  return { session, ...EMPTY, edited: false } // signed in, no twin built yet
}

export function TwinProvider({ children }) {
  const boot = useRef(readInitial()).current

  const [session, setSession] = useState(boot.session) // { key, name, personaId } | null
  const [twin, setTwin] = useState(boot.twin)
  const [items, setItems] = useState(boot.items)
  const [symptoms, setSymptoms] = useState(boot.symptoms)
  const [notes, setNotes] = useState(boot.notes)
  const [history, setHistory] = useState(boot.history)
  const [flags, setFlags] = useState(boot.flags)
  const [organRisk, setOrganRisk] = useState(boot.organRisk)
  const [overall, setOverall] = useState(boot.overall)
  const [status, setStatus] = useState(boot.status)
  const [error, setError] = useState(null)
  const [edited, setEdited] = useState(boot.edited || false)

  // ── AI-calculated assessment (overlays the deterministic baseline) ──
  // `assessment` holds the AI (or engine-fallback) organ scores / body index /
  // flags. The engine states above stay as the instant baseline + what we
  // persist; the AI result is recomputed whenever the logged items change.
  const [assessment, setAssessment] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const analyzeReq = useRef(0)

  // ── AI analysis: recalculate the stats from the data whenever items change ──
  // Runs after the deterministic baseline is already on screen, so the UI never
  // waits. A request counter drops any stale (out-of-order) AI response.
  useEffect(() => {
    if (status !== 'ready' || !items.length) {
      setAssessment(null)
      setAnalyzing(false)
      return
    }
    const reqId = ++analyzeReq.current
    if (analysis.isAI) setAnalyzing(true)
    analysis
      .assess({ items, symptoms, name: twin?.name, profile: {} })
      .then((res) => {
        if (analyzeReq.current === reqId) setAssessment(res)
      })
      .catch(() => {
        if (analyzeReq.current === reqId) setAssessment(null)
      })
      .finally(() => {
        if (analyzeReq.current === reqId) setAnalyzing(false)
      })
  }, [items, symptoms, status, twin])

  // ── Auto-persist: whenever a signed-in account's twin changes, save it. ──
  useEffect(() => {
    if (!session?.key) return
    saveProfile(session.key, {
      key: session.key,
      name: session.name,
      personaId: session.personaId || null,
      updatedAt: Date.now(),
      edited,
      twin,
      items,
      symptoms,
      notes,
      history,
      flags,
      organRisk,
      overall,
    })
  }, [session, twin, items, symptoms, notes, history, flags, organRisk, overall, edited])

  const hydrateTwin = useCallback((p) => {
    const eff = effectiveProfile(p)
    const derived = resolveDerived(eff)
    setTwin(eff.twin || null)
    setItems(eff.items || [])
    setSymptoms(eff.symptoms || [])
    setNotes(eff.notes || '')
    setHistory(eff.history || [])
    setFlags(derived.flags)
    setOrganRisk(derived.organRisk)
    setOverall(derived.overall)
    setEdited(Boolean(p.edited))
    setStatus(eff.twin ? 'ready' : 'idle')
  }, [])

  const clearTwin = useCallback(() => {
    setTwin(null)
    setItems([])
    setSymptoms([])
    setNotes('')
    setHistory([])
    setFlags([])
    setOrganRisk({})
    setOverall('calm')
    setStatus('idle')
    setError(null)
    setEdited(false)
  }, [])

  /**
   * Log one or many doses taken "today" in a single pass — the twin is living,
   * not a one-off snapshot. Accepts a single {substanceId, dose} or an array of
   * them; entries for substances not in the built-in catalog may carry a resolved
   * `def` (HOLON/AI) so custom substances flow through interactions + analysis.
   * Because React batches state, several doses MUST be applied against one shared
   * copy of history/items here (not by calling this repeatedly), otherwise later
   * doses would overwrite earlier ones. Bumps today's history entry, reflects it
   * in the current pattern, recomputes flags / organ risk / overall so every
   * screen stays in sync, and returns per-dose results ({ substanceId, todayTimes, name }).
   */
  const logDoses = useCallback(
    (entries) => {
      const list = (Array.isArray(entries) ? entries : [entries]).filter(
        (e) => e && (SUBSTANCE_BY_ID[e.substanceId] || e.def)
      )
      if (!list.length) return null

      // One shared clone of today's history that every dose accumulates into.
      const days = history?.length
        ? history.map((d) => ({ ...d, items: d.items.map((i) => ({ ...i })) }))
        : [{ day: 'Today', items: [] }]
      let idx = days.findIndex((d) => d.day === 'Today')
      if (idx === -1) {
        days.push({ day: 'Today', items: [] })
        idx = days.length - 1
      }
      const dayItems = days[idx].items
      const newItems = items.map((i) => ({ ...i }))
      const results = []

      for (const { substanceId, dose, def: customDef } of list) {
        const catalogDef = SUBSTANCE_BY_ID[substanceId]
        const def = catalogDef || customDef
        const useDose = Number(dose) > 0 ? Number(dose) : def.typicalDose || 1
        // Carry the resolved definition for custom (non-catalog) substances so
        // future recomputes can still evaluate them.
        const carry = catalogDef ? {} : { def }

        // Bump today's history entry.
        const di = dayItems.findIndex((it) => it.substanceId === substanceId)
        let todayTimes
        if (di === -1) {
          todayTimes = 1
          dayItems.push({ substanceId, dose: useDose, times: 1, ...carry })
        } else {
          todayTimes = (dayItems[di].times || 1) + 1
          dayItems[di] = { ...dayItems[di], dose: useDose, times: todayTimes }
        }

        // Reflect in the current pattern (never lowers an existing frequency).
        const ii = newItems.findIndex((i) => i.substanceId === substanceId)
        if (ii === -1) {
          newItems.push({ substanceId, dose: useDose, frequency: `x${todayTimes}/day`, ...carry })
        } else {
          const times = Math.max(todayTimes, frequencyToTimes(newItems[ii].frequency))
          newItems[ii] = { ...newItems[ii], dose: useDose, frequency: `x${times}/day` }
        }

        results.push({ substanceId, todayTimes, name: def.label.split(' (')[0] })
      }

      const derived = deriveTwinState(newItems)
      setHistory(days)
      setItems(newItems)
      setFlags(derived.flags)
      setOrganRisk(derived.organRisk)
      setOverall(derived.overall)
      setEdited(true)
      return results
    },
    [history, items]
  )

  // Single-dose convenience wrapper (kept for existing callers).
  const logDose = useCallback((entry) => logDoses(entry)?.[0] ?? null, [logDoses])

  /** Core pipeline: create twin -> HOLON interactions -> twin state. */
  const buildTwin = useCallback(async ({ name, profile, items, symptoms, notes, history }) => {
    setStatus('building')
    setError(null)
    try {
      const created = await twinApi.createTwin({ name, profile })
      const foundFlags = await holon.lookupInteractions(items)
      const state = await twinApi.getTwinState({ twinId: created.twinId, flags: foundFlags })

      setTwin(created)
      setItems(items)
      setSymptoms(symptoms || [])
      setNotes(notes || '')
      setHistory(history && history.length ? history : synthHistory(items))
      setFlags(foundFlags)
      setOrganRisk(state.organRisk)
      setOverall(state.overall)
      setEdited(false)
      setStatus('ready')
      return true
    } catch (e) {
      setError(e.message || 'Something went wrong building your twin.')
      setStatus('error')
      return false
    }
  }, [])

  /**
   * Sign in with a typed name. Returns { hasTwin } so the caller can route to
   * the dashboard (returning user) or the landing/intake (new user).
   */
  const signIn = useCallback(
    (name) => {
      const key = userKey(name)
      const existing = getProfile(key)
      setCurrentKey(key)
      setError(null)

      if (existing?.twin) {
        setSession({ key, name: existing.name, personaId: existing.personaId || null })
        hydrateTwin(existing)
        return { hasTwin: true }
      }

      // New (or twin-less) account.
      const displayName = existing?.name || name.trim()
      setSession({ key, name: displayName, personaId: null })
      clearTwin()
      // Persist a stub immediately so the account shows up on return visits.
      saveProfile(key, { key, name: displayName, personaId: null, updatedAt: Date.now(), twin: null })
      return { hasTwin: false }
    },
    [hydrateTwin, clearTwin]
  )

  /** Resume a saved account by its storage key (used by the gate's quick-resume). */
  const resumeAccount = useCallback(
    (key) => {
      const p = getProfile(key)
      if (!p) return { ok: false, hasTwin: false }
      setCurrentKey(key)
      setSession({ key, name: p.name, personaId: p.personaId || null })
      hydrateTwin(p)
      return { ok: true, hasTwin: Boolean(p.twin) }
    },
    [hydrateTwin]
  )

  /** Load one of the fabricated demo personas as its own persistent account. */
  const loadPersona = useCallback(
    (personaId) => {
      const p = PERSONAS.find((x) => x.id === personaId)
      if (!p) return Promise.resolve(false)
      const key = personaKeyOf(personaId)
      setCurrentKey(key)
      setSession({ key, name: p.name, personaId })
      return buildTwin({
        name: p.name,
        profile: p.profile,
        items: p.current,
        symptoms: p.symptoms,
        notes: p.blurb,
        history: p.history,
      })
    },
    [buildTwin]
  )

  /** Sign out — keeps the account's saved data, just drops the session. */
  const signOut = useCallback(() => {
    clearCurrentKey()
    setSession(null)
    clearTwin()
  }, [clearTwin])

  const value = useMemo(
    () => ({
      session,
      twin,
      items,
      symptoms,
      notes,
      history,
      // AI-primary: prefer the AI assessment, fall back to the engine baseline.
      flags: assessment?.flags ?? flags,
      organRisk: assessment?.organRisk ?? organRisk,
      overall: assessment?.overall ?? overall,
      bodyIndex: assessment?.bodyIndex ?? computeBodyIndex(items),
      insight: assessment?.headline || '',
      analyzing,
      // 'ai' when a model produced the numbers, 'engine' when the formula did.
      statsSource: assessment?.source || 'engine',
      // The untouched deterministic baseline (used by the day-by-day history trend).
      baseline: { flags, organRisk, overall },
      status,
      error,
      isSignedIn: Boolean(session),
      hasTwin: status === 'ready' && Boolean(twin),
      signIn,
      signOut,
      resumeAccount,
      buildTwin,
      loadPersona,
      logDose,
      logDoses,
      reasoning,
    }),
    [
      session, twin, items, symptoms, notes, history, flags, organRisk, overall, status, error,
      assessment, analyzing, signIn, signOut, resumeAccount, buildTwin, loadPersona, logDose, logDoses,
    ]
  )

  return <TwinContext.Provider value={value}>{children}</TwinContext.Provider>
}

export function useTwin() {
  const ctx = useContext(TwinContext)
  if (!ctx) throw new Error('useTwin must be used inside <TwinProvider>')
  return ctx
}
