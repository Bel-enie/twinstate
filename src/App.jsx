import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useTwin } from './context/TwinContext.jsx'
import { ConsentGate } from './components/safety/SafetyLayer.jsx'
import { initSpecularButtons } from './utils/specular.js'

// Every screen is its own chunk, so a landing-page visitor downloads the
// landing page — not the dashboard, intake, chat and What-If as well.
const Landing = lazy(() => import('./pages/Landing.jsx'))
const Intake = lazy(() => import('./pages/Intake.jsx'))
const FAQ = lazy(() => import('./pages/FAQ.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const InteractionDetail = lazy(() => import('./pages/InteractionDetail.jsx'))
const History = lazy(() => import('./pages/History.jsx'))
const WhatIf = lazy(() => import('./pages/WhatIf.jsx'))
const Recommendation = lazy(() => import('./pages/Recommendation.jsx'))
const Summary = lazy(() => import('./pages/Summary.jsx'))
const Limits = lazy(() => import('./pages/Limits.jsx'))

const TITLES = {
  '/': 'Twinstate: every pill, drink and dose, checked together',
  '/intake': 'Build your twin · Twinstate',
  '/dashboard': 'Your twin · Twinstate',
  '/history': 'Last 7 days · Twinstate',
  '/what-if': 'What-If · Twinstate',
  '/recommendation': 'Next step · Twinstate',
  '/faq': 'FAQ · Twinstate',
  '/summary': 'Summary for your clinician · Twinstate',
  '/limits': 'How it works and its limits · Twinstate',
}

/**
 * Route hygiene: every navigation starts at the top of the new page (unless
 * it targets an in-page anchor) and names the page in the tab title.
 */
function RouteEffects() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const key = pathname.startsWith('/interaction/') ? '/dashboard' : pathname
    document.title = TITLES[key] || 'Twinstate'
  }, [pathname, hash])
  return null
}

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-live="polite">
      <span className="h-2.5 w-2.5 animate-pulseGlow rounded-full bg-violet-500" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

/**
 * Home decision. The landing page is the single front door — it carries both the
 * pitch and the sign-in form, so signed-out visitors see it directly rather than
 * being bounced to a separate gate. Returning users with a built twin skip
 * straight to their dashboard.
 */
function Boot() {
  const { hasTwin } = useTwin()
  if (hasTwin) return <Navigate to="/dashboard" replace />
  return <Landing />
}

/**
 * Needs a signed-in account (but not necessarily a built twin).
 * The medical consent gate lives here and on RequireTwin — i.e. on entry to the
 * product — so the public landing page can be read without a modal, while no
 * product screen is reachable without consent.
 */
function RequireSession({ children }) {
  const { isSignedIn } = useTwin()
  return isSignedIn ? <ConsentGate>{children}</ConsentGate> : <Navigate to="/" replace />
}

/** Needs a fully built twin — otherwise route to the right earlier step. */
function RequireTwin({ children }) {
  const { isSignedIn, hasTwin } = useTwin()
  if (!isSignedIn) return <Navigate to="/" replace />
  if (!hasTwin) return <Navigate to="/intake" replace />
  return <ConsentGate>{children}</ConsentGate>
}

export default function App() {
  // Primary buttons are specular app-wide now, not just on the landing page,
  // so the pointer-following reflection is initialised once at the root.
  useEffect(() => initSpecularButtons(), [])

  return (
    <>
      <RouteEffects />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/faq" element={<FAQ />} />
          <Route path="/limits" element={<Limits />} />
          <Route
            path="/summary"
            element={
              <RequireTwin>
                <Summary />
              </RequireTwin>
            }
          />
          <Route path="/" element={<Boot />} />
          <Route
            path="/intake"
            element={
              <RequireSession>
                <Intake />
              </RequireSession>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireTwin>
                <Dashboard />
              </RequireTwin>
            }
          />
          <Route
            path="/interaction/:flagId"
            element={
              <RequireTwin>
                <InteractionDetail />
              </RequireTwin>
            }
          />
          <Route
            path="/history"
            element={
              <RequireTwin>
                <History />
              </RequireTwin>
            }
          />
          <Route
            path="/what-if"
            element={
              <RequireTwin>
                <WhatIf />
              </RequireTwin>
            }
          />
          <Route
            path="/recommendation"
            element={
              <RequireTwin>
                <Recommendation />
              </RequireTwin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
