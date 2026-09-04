import { Link } from 'react-router-dom'
import logo from '../assets/images/convergence-mvmnt.png'

const EXPLORE = [
  { label: 'For Disciples', to: '/' },
  { label: 'For Leaders', to: '/leaders' },
  { label: 'For Pastors', to: '/pastors' },
  { label: 'About Mike', to: '/#meet-mike' },
]

const COLUMNS = {
  '/': [
    {
      title: 'Programs',
      links: [
        { label: 'Inherit Your Freedom', href: '#featured' },
        { label: 'The Movement', href: '#featured' },
        { label: 'Legacy Circle', href: '#featured' },
      ],
    },
    {
      title: 'Experiences',
      links: [
        { label: 'Greece & Turkey Tour', to: '/leaders#tour' },
        { label: 'Restore Conference', href: '#events' },
        { label: 'Books', href: '#featured' },
      ],
    },
  ],
  '/leaders': [
    {
      title: 'Programs',
      links: [
        { label: 'Breakthrough Protocol', href: '#tour' },
        { label: 'The Movement', href: '#tour' },
        { label: 'Legacy Circle', href: '#tour' },
      ],
    },
    {
      title: 'Experiences',
      links: [
        { label: 'Greece & Turkey Tour', href: '#tour' },
        { label: 'Restore Conference', to: '/#events' },
        { label: 'Books', to: '/#featured' },
      ],
    },
  ],
  '/pastors': [
    {
      title: 'Programs',
      links: [
        { label: 'Church Systems Starter Kit', href: '#guide' },
        { label: 'The Movement for Pastors', href: '#guide' },
        { label: 'Inner Circle Coaching', href: '#guide' },
      ],
    },
    {
      title: 'Experiences',
      links: [
        { label: 'Greece & Turkey Tour', to: '/leaders#tour' },
        { label: 'Restore Conference', to: '/#events' },
        { label: 'Books', to: '/#featured' },
      ],
    },
  ],
  '/events': [
    {
      title: 'Events',
      links: [
        { label: 'Greece & Turkey Tour', href: '#tour' },
        { label: 'Conferences', href: '#upcoming' },
        { label: 'BRKRS Nights', href: '#upcoming' },
        { label: 'Stay Updated', href: '#stay' },
      ],
    },
    {
      title: 'Programs',
      links: [
        { label: 'Inherit Your Freedom', to: '/#featured' },
        { label: 'Membership', to: '/#membership' },
        { label: 'Books', to: '/#featured' },
      ],
    },
  ],
}

const SOCIALS = [
  {
    label: 'YouTube',
    path: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    label: 'Instagram',
    path: (
      <>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  { label: 'TikTok', path: <path d="M15 4v9.5a4 4 0 1 1-4-4M15 7a5 5 0 0 0 5 4" /> },
  {
    label: 'Facebook',
    path: <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v8h4v-8h3l1-4h-4V7.5A1.5 1.5 0 0 1 13.5 6H16z" />,
  },
]

function FooterLink({ link }) {
  const className = 'font-serif text-[15px] text-cream/60 no-underline hover:text-cream'
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

export default function PublicFooter({ page = '/' }) {
  const columns = COLUMNS[page] ?? COLUMNS['/']

  return (
    <footer className="bg-ink-deep pt-[72px]">
      <div className="mx-auto max-w-[1200px] px-8">
        <div className="grid grid-cols-1 gap-12 pb-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <img src={logo} alt="Convergence MVMNT" className="block h-[55px] w-auto" />
            </div>
            <p className="mb-5 max-w-[280px] font-serif text-[15px] leading-[1.6] text-cream/50">
              A faith-based media and growth community. A Mike Signorelli Ministries property.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#top"
                  aria-label={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-cream/70"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {s.path}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-[18px] font-sans text-xs font-semibold uppercase tracking-[0.12em] text-gold">Explore</div>
            <div className="flex flex-col gap-[11px]">
              {EXPLORE.map((link) => (
                <FooterLink key={link.label} link={link} />
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div className="mb-[18px] font-sans text-xs font-semibold uppercase tracking-[0.12em] text-gold">{col.title}</div>
              <div className="flex flex-col gap-[11px]">
                {col.links.map((link) => (
                  <FooterLink key={link.label} link={link} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-cream/10 py-6 pb-10">
          <span className="font-serif text-sm text-cream/[42%]">© 2026 Movement Network. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/" className="font-sans text-xs uppercase tracking-[0.06em] text-cream/[42%] no-underline hover:text-cream/70">
              Privacy Policy
            </Link>
            <Link to="/" className="font-sans text-xs uppercase tracking-[0.06em] text-cream/[42%] no-underline hover:text-cream/70">
              Terms of Service
            </Link>
            <Link to="/" className="font-sans text-xs uppercase tracking-[0.06em] text-cream/[42%] no-underline hover:text-cream/70">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
