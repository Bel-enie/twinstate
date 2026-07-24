import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { TwinProvider } from './context/TwinContext.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <TwinProvider>
          <App />
        </TwinProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
