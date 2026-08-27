import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function PublicFooter() {
  return (
    <footer className="bg-cv-sidebar border-t border-white/[0.07] py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-start justify-between">
        <div>
          <Logo height={34} />
          <p className="font-serif text-cv-text/50 text-sm mt-3 max-w-xs leading-relaxed">
            A movement for men who refuse to pass their wounds to the next generation.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Footer navigation">
          {[
            { label: 'For Disciples', to: '/' },
            { label: 'For Leaders',   to: '/leaders' },
            { label: 'For Pastors',   to: '/pastors' },
            { label: 'Events',        to: '/events' },
            { label: 'Dashboard',     to: '/dashboard' },
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="font-sans font-semibold text-xs tracking-widest uppercase text-cv-text/50 hover:text-cv-gold transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/[0.05] flex items-center justify-between gap-4 flex-wrap">
        <span className="font-sans text-xs text-cv-text/30 tracking-wide">
          © {new Date().getFullYear()} Convergence MVMNT. All rights reserved.
        </span>
        <span className="font-sans text-xs text-cv-text/30 tracking-wide">
          Built for men who want more.
        </span>
      </div>
    </footer>
  )
}
