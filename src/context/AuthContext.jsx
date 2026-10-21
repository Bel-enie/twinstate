import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authEnabled, watchUser } from '../services/auth.js'

/**
 * The signed-in Firebase user, app-wide.
 *   enabled: sign-in is configured (otherwise the first-name sign-in is used)
 *   ready:   the first auth state has arrived (always true when not enabled)
 *   user:    { uid, email, name, photo, provider } | null
 */
const AuthContext = createContext({ enabled: false, ready: true, user: null })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ready: !authEnabled, user: null, failed: false })

  useEffect(() => {
    if (!authEnabled) return undefined
    let alive = true
    let unsubscribe = () => {}
    watchUser((user) => alive && setState({ ready: true, user, failed: false }))
      .then((fn) => {
        unsubscribe = fn
      })
      // Firebase could not load (offline, blocked script): treat as signed out rather than hang.
      .catch(() => alive && setState({ ready: true, user: null, failed: true }))
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ enabled: authEnabled, ...state }), [state])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
