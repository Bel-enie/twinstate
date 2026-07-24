import Header from './Header.jsx'
import BrandMark from '../ui/BrandMark.jsx'
import { MedicalDisclaimer } from '../safety/SafetyLayer.jsx'

/**
 * Page-in-a-card shell: the whole app floats as one soft, rounded surface on a
 * warm neutral backdrop (à la premium product marketing sites), with generous
 * breathing room. Full-bleed on mobile, floating card from `sm` up.
 */
export default function AppShell({ children, wide = false }) {
  return (
    <div className="min-h-full bg-shell sm:p-4 lg:p-6">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col bg-cream shadow-shell sm:min-h-[calc(100vh-2rem)] sm:rounded-[2.25rem] lg:min-h-[calc(100vh-3rem)]">
        <Header />
        <main className={`mx-auto w-full flex-1 px-4 py-7 sm:px-6 lg:px-8 ${wide ? 'max-w-6xl' : 'max-w-5xl'}`}>
          {children}
        </main>
        <footer className="mx-auto w-full max-w-5xl px-6 py-7">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-soft sm:flex-row">
            <span className="flex items-center gap-1.5 font-semibold">
              <BrandMark className="h-5 w-5 rounded-md" />
              <span>
                <span className="text-brand-500">Twin</span>
                <span className="text-risk-calm">state</span>
              </span>
              <span className="font-normal text-slate-soft/80">· your ultimate health twin</span>
            </span>
            <span className="text-center sm:text-right">Powered by Ontomorph DTP + HOLON.</span>
          </div>
          <MedicalDisclaimer className="mt-4 border-t border-ink/5 pt-4 text-center sm:text-left" />
        </footer>
      </div>
    </div>
  )
}
