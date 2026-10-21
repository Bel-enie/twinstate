import { Link } from 'react-router-dom'
import { privacyLine } from '../../services/privacy.js'
import BrandMark from '../ui/BrandMark.jsx'

export default function Footer() {
  return (
    <footer className="bg-void text-mist">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="text-base font-extrabold tracking-tight text-frost">
              Twin<span className="bg-[linear-gradient(90deg,#6AA6FF,#A78BFA)] bg-clip-text text-transparent">state</span>
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">
            A digital twin that brings scattered medication data into one picture. Built on
            Ontomorph DTP + HOLON for a one-week university hackathon.
          </p>
        </div>

        <nav className="flex gap-12 text-sm" aria-label="Footer">
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-frost/70">Explore</p>
            <a href="#story" className="block transition hover:text-frost">Why a twin</a>
            <a href="#twin" className="block transition hover:text-frost">Live twin</a>
            <a href="#access" className="block transition hover:text-frost">Early access</a>
          </div>
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-frost/70">More</p>
            <Link to="/faq" className="block transition hover:text-frost">FAQ</Link>
            <Link to="/limits" className="block transition hover:text-frost">How it works &amp; limits</Link>
            <a href="#top" className="block transition hover:text-frost">Back to top</a>
          </div>
        </nav>
      </div>
      <div className="border-t border-hairline/50">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 py-6 text-xs leading-relaxed sm:px-8 md:flex-row md:items-start md:justify-between md:gap-10">
          <p className="shrink-0 text-mist">© 2026 Twinstate · OAU, Ontomorph Hackathon</p>
          <p className="max-w-2xl text-mist md:text-right">
            An educational tool, not a medical device. It does not diagnose or make prescription
            decisions. In an emergency, contact local emergency services. {privacyLine()}
          </p>
        </div>
      </div>
    </footer>
  )
}
