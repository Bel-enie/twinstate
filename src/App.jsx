import { Navigate, Route, Routes } from 'react-router-dom'
import { useTwin } from './context/TwinContext.jsx'

import Welcome from './pages/Welcome.jsx'
import Landing from './pages/Landing.jsx'
import Intake from './pages/Intake.jsx'
import FAQ from './pages/FAQ.jsx'
import Dashboard from './pages/Dashboard.jsx'
import InteractionDetail from './pages/InteractionDetail.jsx'
import History from './pages/History.jsx'
import WhatIf from './pages/WhatIf.jsx'
import Recommendation from './pages/Recommendation.jsx'

/** Home decision: gate first-timers, fast-track returning users to their twin. */
function Boot() {
  const { isSignedIn, hasTwin } = useTwin()
  if (!isSignedIn) return <Navigate to="/welcome" replace />
  if (hasTwin) return <Navigate to="/dashboard" replace />
  return <Landing />
}

/** Needs a signed-in account (but not necessarily a built twin). */
function RequireSession({ children }) {
  const { isSignedIn } = useTwin()
  return isSignedIn ? children : <Navigate to="/welcome" replace />
}

/** Needs a fully built twin — otherwise route to the right earlier step. */
function RequireTwin({ children }) {
  const { isSignedIn, hasTwin } = useTwin()
  if (!isSignedIn) return <Navigate to="/welcome" replace />
  if (!hasTwin) return <Navigate to="/intake" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
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
