import { Navigate, Route, Routes } from 'react-router-dom'
import { useTwin } from './context/TwinContext.jsx'

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

/** Needs a signed-in account (but not necessarily a built twin). */
function RequireSession({ children }) {
  const { isSignedIn } = useTwin()
  return isSignedIn ? children : <Navigate to="/" replace />
}

/** Needs a fully built twin — otherwise route to the right earlier step. */
function RequireTwin({ children }) {
  const { isSignedIn, hasTwin } = useTwin()
  if (!isSignedIn) return <Navigate to="/" replace />
  if (!hasTwin) return <Navigate to="/intake" replace />
  return children
}

export default function App() {
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
