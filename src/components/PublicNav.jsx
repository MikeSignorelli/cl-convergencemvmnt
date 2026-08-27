import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'

const NAV_LINKS = [
  { label: 'For Disciples', to: '/' },
  { label: 'For Leaders',   to: '/leaders' },
  { label: 'For Pastors',   to: '/pastors' },
  { label: 'Events',        to: '/events' },
]

export default function PublicNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-cv-sidebar/90 backdrop-blur-md border-b border-white/[0.07]">
      <div className="max-w-6xl mx-auto px-6 h-[70px] flex items-center justify-between gap-6">
        <Link to="/" aria-label="Convergence MVMNT Home">
          <Logo height={38} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-[9px] font-sans font-semibold text-xs tracking-widest uppercase transition-colors ${
                  isActive
                    ? 'bg-cv-gold/15 text-cv-gold-lt'
                    : 'text-cv-text/60 hover:text-cv-text hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/onboarding"
            className="px-5 py-2.5 rounded-full bg-cv-gold text-cv-bg font-sans font-semibold text-xs tracking-widest uppercase hover:brightness-110 transition-all"
          >
            Join the movement
          </Link>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-full border border-white/20 text-cv-text/70 font-sans font-semibold text-xs tracking-widest uppercase hover:text-cv-text hover:border-white/40 transition-all"
          >
            Sign in
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-cv-text/60 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-white/[0.07] bg-cv-sidebar px-6 py-4 flex flex-col gap-2" aria-label="Mobile navigation">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-4 py-3 rounded-[9px] font-sans font-semibold text-xs tracking-widest uppercase ${
                  isActive ? 'bg-cv-gold/15 text-cv-gold-lt' : 'text-cv-text/60'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/[0.07]">
            <Link to="/onboarding" onClick={() => setOpen(false)} className="px-4 py-3 rounded-full bg-cv-gold text-cv-bg font-sans font-semibold text-xs tracking-widest uppercase text-center">
              Join the movement
            </Link>
            <Link to="/dashboard" onClick={() => setOpen(false)} className="px-4 py-3 rounded-full border border-white/20 text-cv-text/70 font-sans font-semibold text-xs tracking-widest uppercase text-center">
              Sign in
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
