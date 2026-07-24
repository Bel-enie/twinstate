import { Component } from 'react'

/**
 * App-wide error boundary. A health tool must never show a blank white screen —
 * if a render throws, we catch it, keep the emergency guidance visible, and give
 * the user a clean way to recover instead of losing the page entirely.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // In production this is where you'd forward to your error monitor.
    console.error('[Twinstate] render error:', error, info?.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-shell p-6">
        <div className="w-full max-w-md rounded-3xl bg-cream p-6 text-center shadow-shell">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-risk-caution/15 text-2xl">
            ⚠️
          </div>
          <h1 className="text-lg font-extrabold">Something went wrong on this screen</h1>
          <p className="mt-2 text-sm text-slate-soft">
            Your logged data is safe. You can reload and pick up where you left off.
          </p>
          <div className="mt-4 rounded-2xl border border-risk-urgent/30 bg-risk-urgent/5 p-3 text-left text-xs text-ink/80">
            <span className="font-bold">Medical emergency?</span> Don’t wait on an app — call your
            local emergency number or go to the nearest emergency department.
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              Reload
            </button>
            <button
              onClick={this.handleReset}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }
}
