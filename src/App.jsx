import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTwin } from './context/TwinContext.jsx'
import { ConsentGate } from './components/safety/SafetyLayer.jsx'
import { initSpecularButtons } from './components/marketing/specular.js'

import Landing from './pages/Landing.jsx'
import Intake from './pages/Intake.jsx'
import FAQ from './pages/FAQ.jsx'
import Dashboard from './pages/Dashboard.jsx'
import InteractionDetail from './pages/InteractionDetail.jsx'
import History from './pages/History.jsx'
import WhatIf from './pages/WhatIf.jsx'
import Recommendation from './pages/Recommendation.jsx'

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
    <Routes>
      <Route path="/faq" element={<FAQ />} />
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
  )
}
