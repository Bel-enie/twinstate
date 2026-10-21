import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { TwinProvider } from './context/TwinContext.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import './index.css'

// Annotate mode exists only on the dev server. In a production build
// import.meta.env.DEV is false, so this branch, and the file, drop out.
const Annotator = import.meta.env.DEV ? lazy(() => import('./dev/Annotator.jsx')) : null

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <TwinProvider>
            <App />
          </TwinProvider>
        </AuthProvider>
        {Annotator && (
          <Suspense fallback={null}>
            <Annotator />
          </Suspense>
        )}
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
