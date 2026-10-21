/**
 * Sign-in through Firebase Authentication: "Continue with Google" and email +
 * password (with password-reset emails). Firebase is loaded on demand, so
 * nothing is downloaded unless sign-in is configured.
 *
 * Switched on by the VITE_FIREBASE_* values in .env.local (see .env.example).
 * When they are missing, `authEnabled` is false and the app keeps its
 * first-name sign-in.
 */
import { config } from './config.js'

const fb = config.firebase
export const authEnabled = Boolean(fb.apiKey && fb.authDomain && fb.projectId)

let loading = null
function load() {
  if (!authEnabled) return Promise.resolve(null)
  if (!loading) {
    loading = Promise.all([import('firebase/app'), import('firebase/auth')]).then(([app, auth]) => {
      const instance = app.getApps().length
        ? app.getApp()
        : app.initializeApp({ apiKey: fb.apiKey, authDomain: fb.authDomain, projectId: fb.projectId, appId: fb.appId })
      return { auth: auth.getAuth(instance), m: auth }
    })
  }
  return loading
}

/** The parts of a Firebase user the app uses. */
function toUser(u, nameOverride) {
  if (!u) return null
  const email = u.email || ''
  return {
    uid: u.uid,
    email,
    name: nameOverride || u.displayName || email.split('@')[0] || 'You',
    photo: u.photoURL || '',
    provider: u.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
  }
}

/** Call `cb(user | null)` now and on every sign-in change. Returns an unsubscribe function. */
export async function watchUser(cb) {
  const r = await load()
  if (!r) {
    cb(null)
    return () => {}
  }
  // Finish a Google sign-in that fell back to a full-page redirect.
  try {
    await r.m.getRedirectResult(r.auth)
  } catch {
    /* the state listener below still reports the outcome */
  }
  return r.m.onAuthStateChanged(r.auth, (u) => cb(toUser(u)))
}

export async function signInWithGoogle() {
  const { auth, m } = await load()
  const provider = new m.GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    const res = await m.signInWithPopup(auth, provider)
    return toUser(res.user)
  } catch (e) {
    // Popups are blocked in some in-app and mobile browsers: use a redirect instead.
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
      await m.signInWithRedirect(auth, provider)
      return null
    }
    throw e
  }
}

export async function signInWithEmail(email, password) {
  const { auth, m } = await load()
  const res = await m.signInWithEmailAndPassword(auth, email.trim(), password)
  return toUser(res.user)
}

export async function createAccount(name, email, password) {
  const { auth, m } = await load()
  const res = await m.createUserWithEmailAndPassword(auth, email.trim(), password)
  const clean = name.trim()
  if (clean) await m.updateProfile(res.user, { displayName: clean })
  return toUser(res.user, clean)
}

export async function sendReset(email) {
  const { auth, m } = await load()
  await m.sendPasswordResetEmail(auth, email.trim())
}

export async function signOutUser() {
  const r = await load()
  if (r) await r.m.signOut(r.auth)
}

/** Firebase error codes in plain words. Empty string means "say nothing" (e.g. the user closed the popup). */
export function authErrorMessage(e) {
  const code = e?.code || ''
  const map = {
    'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/missing-password': 'Enter your password.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-login-credentials': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
    'auth/weak-password': 'Use a password of at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'No connection. Check your internet and try again.',
    'auth/popup-closed-by-user': '',
    'auth/cancelled-popup-request': '',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/unauthorized-domain': 'This website isn’t allowed to sign in yet. Add its domain under Authorized domains in Firebase.',
    'auth/operation-not-allowed': 'This sign-in method isn’t switched on in Firebase yet.',
    'auth/invalid-api-key': 'Sign-in isn’t set up correctly: the Firebase key is not valid.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Sign-in isn’t set up correctly: the Firebase key is not valid.',
  }
  if (code in map) return map[code]
  if (code.startsWith('auth/api-key')) return 'Sign-in isn’t set up correctly: the Firebase key is not valid.'
  return 'Sign-in failed. Please try again.'
}
