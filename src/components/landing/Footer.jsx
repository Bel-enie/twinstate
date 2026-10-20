import { Link } from 'react-router-dom'
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
            A living digital twin that turns scattered medication data into one picture — built on
            Ontomorph DTP + HOLON for a one-week university hackathon.
          </p>
        </div>

        <nav className="flex gap-12 text-sm" aria-label="Footer">
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-frost/70">Explore</p>
            <a href="#twin" className="block transition hover:text-frost">Live twin</a>
            <a href="#how" className="block transition hover:text-frost">How it works</a>
            <a href="#access" className="block transition hover:text-frost">Early access</a>
          </div>
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-frost/70">More</p>
            <Link to="/faq" className="block transition hover:text-frost">FAQ</Link>
            <a href="#top" className="block transition hover:text-frost">Back to top</a>
          </div>
        </nav>
      </div>
      <div className="border-t border-hairline/50">
        <p className="mx-auto max-w-[1200px] px-5 py-5 text-xs text-mist/70 sm:px-8">
          Educational demo — not medical advice, not a diagnosis. Everything you log stays in your
          browser.
        </p>
      </div>
    </footer>
  )
}
