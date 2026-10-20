import Header from './Header.jsx'
import BrandMark from '../ui/BrandMark.jsx'
import Wordmark from '../ui/Wordmark.jsx'
import Aurora from '../landing/ui/Aurora.jsx'
import { MedicalDisclaimer } from '../safety/SafetyLayer.jsx'

/**
 * Page-in-a-card shell: the whole app floats as one rounded white surface over
 * the same aurora ground as the landing page, so product and site read as one
 * thing. Full-bleed on mobile, floating card from `sm` up.
 */
export default function AppShell({ children, wide = false }) {
  return (
    <div className="relative min-h-full overflow-x-clip bg-paper sm:p-4 lg:p-6">
      <Aurora />
      <div className="app-card relative mx-auto flex min-h-full max-w-6xl flex-col sm:min-h-[calc(100vh-2rem)] sm:rounded-[2.25rem] lg:min-h-[calc(100vh-3rem)]">
        <Header />
        <main className={`mx-auto w-full flex-1 px-4 py-7 sm:px-6 lg:px-8 ${wide ? 'max-w-6xl' : 'max-w-5xl'}`}>
          {children}
        </main>
        <footer className="mx-auto w-full max-w-5xl px-6 py-7">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-soft sm:flex-row">
            <span className="flex items-center gap-1.5 font-semibold">
              <BrandMark className="h-5 w-5 rounded-md" />
              <Wordmark />
              <span className="font-normal text-slate-soft/80">· your living health twin</span>
            </span>
            <span className="text-center sm:text-right">Powered by Ontomorph DTP + HOLON.</span>
          </div>
          <MedicalDisclaimer className="mt-4 border-t border-ink/10 pt-4 text-center sm:text-left" />
        </footer>
      </div>
    </div>
  )
}
