import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/images/convergence-mvmnt.png'

const NAV_LINKS = {
  '/': [
    { label: 'For Disciples', href: '#featured', active: true },
    { label: 'For Leaders', to: '/leaders' },
    { label: 'For Pastors', to: '/pastors' },
    { label: 'About', href: '#meet-mike' },
    { label: 'Events', to: '/events' },
  ],
  '/leaders': [
    { label: 'For Disciples', to: '/' },
    { label: 'For Leaders', href: '#top', active: true },
    { label: 'For Pastors', to: '/pastors' },
    { label: 'About', to: '/#meet-mike' },
    { label: 'Events', href: '#tour' },
  ],
  '/pastors': [
    { label: 'For Disciples', to: '/' },
    { label: 'For Leaders', to: '/leaders' },
    { label: 'For Pastors', href: '#top', active: true },
    { label: 'About', to: '/#meet-mike' },
    { label: 'Events', to: '/events' },
  ],
  '/events': [
    { label: 'For Disciples', to: '/' },
    { label: 'For Leaders', to: '/leaders' },
    { label: 'For Pastors', to: '/pastors' },
    { label: 'About', to: '/#meet-mike' },
    { label: 'Events', href: '#top', active: true },
  ],
}

const CTA = {
  '/': { label: 'Join the Movement', to: '/onboarding?tier=disciple' },
  '/leaders': { label: 'Join the Movement', to: '/onboarding?tier=leader' },
  '/pastors': { label: 'Free Guide', href: '#guide' },
  '/events': { label: 'Stay Updated', href: '#stay' },
}

function NavItem({ link }) {
  const className = `text-[13px] font-medium uppercase tracking-[0.12em] no-underline transition-colors ${
    link.active ? 'text-cream-solid font-semibold' : 'text-cream/72 hover:text-cream-solid'
  }`
  if (link.to) {
    return (
      <Link to={link.to} className={className}>
        {link.label}
      </Link>
    )
  }
  return (
    <a href={link.href} className={className}>
      {link.label}
    </a>
  )
}

export default function PublicNav({ page = '/' }) {
  const [dismissed, setDismissed] = useState(false)
  const links = NAV_LINKS[page] ?? NAV_LINKS['/']
  const cta = CTA[page] ?? CTA['/']

  return (
    <>
      {!dismissed && (
        <div className="relative flex min-h-[44px] items-center justify-center bg-ink-deep px-6 py-2.5 text-center text-cream/82 pr-12">
          <span className="font-sans text-[12.5px] font-medium uppercase tracking-[0.08em]">
            Unoffendable Heart — Mike&rsquo;s new book is available for pre-order&nbsp;
            <span className="text-gold">Reserve your copy →</span>
          </span>
          <button
            aria-label="Dismiss announcement"
            onClick={() => setDismissed(true)}
            className="absolute right-4 top-1/2 flex -translate-y-1/2 cursor-pointer border-none bg-transparent p-1 text-cream/60"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <nav className="sticky top-0 z-50 h-[74px] border-b border-gold/[0.14] bg-ink/86 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-6 px-8">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <img src={logo} alt="Convergence MVMNT" className="block h-[55px] w-auto" />
          </Link>
          <div className="hidden items-center gap-[30px] md:flex">
            {links.map((link) => (
              <NavItem key={link.label} link={link} />
            ))}
          </div>
          {cta.to ? (
            <Link
              to={cta.to}
              className="rounded-full bg-gold px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ink no-underline"
            >
              {cta.label}
            </Link>
          ) : (
            <a
              href={cta.href}
              className="rounded-full bg-gold px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ink no-underline"
            >
              {cta.label}
            </a>
          )}
        </div>
      </nav>
    </>
  )
}
