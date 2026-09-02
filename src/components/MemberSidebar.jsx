import { Link } from 'react-router-dom'
import logo from '../assets/images/convergence-mvmnt.png'
import { useAuth } from '../lib/AuthContext'

function initialsOf(name) {
  if (!name) return ''
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
}

const LEARN = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  },
  {
    label: 'Courses',
    to: '/courses',
    icon: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m10 9 5 3-5 3z" />
      </>
    ),
  },
  {
    label: 'Live sessions',
    to: '#',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
  },
  {
    label: 'Resources',
    to: '#',
    icon: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5" />
        <path d="M12 15V3" />
      </>
    ),
  },
]

const CONNECT = [
  {
    label: 'Community',
    to: '#',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    label: 'Messages',
    to: '#',
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
]

const GROW = [
  {
    label: 'My progress',
    to: '/progress',
    icon: (
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    ),
  },
  {
    label: 'Settings',
    to: '#',
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  },
]

const ADMIN = [
  {
    label: 'Members',
    to: '/admin/members',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    label: 'Upload Resources',
    to: '/admin/resources',
    icon: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M17 8l-5-5-5 5" />
        <path d="M12 3v12" />
      </>
    ),
  },
]

function NavGroup({ title, items, active }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="px-3 pb-2 font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-cream/35">{title}</span>
      {items.map((item) => {
        const isActive = item.to === active
        const className = `flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-sans text-[13px] uppercase tracking-[0.09em] no-underline ${
          isActive ? 'bg-gold/[0.13] font-semibold text-[#E9CF9C]' : 'font-medium text-cream/62 hover:text-cream'
        }`
        const content = (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.icon}
            </svg>
            {item.label}
          </>
        )
        return item.to.startsWith('/') ? (
          <Link key={item.label} to={item.to} className={className}>
            {content}
          </Link>
        ) : (
          <a key={item.label} href={item.to} className={className}>
            {content}
          </a>
        )
      })}
    </div>
  )
}

export default function MemberSidebar({ active }) {
  const { profile, isAdmin } = useAuth()
  const displayName = profile?.display_name || profile?.username || '—'
  const initials = initialsOf(displayName) || '—'
  const tierLabel = profile?.tier ? profile.tier[0].toUpperCase() + profile.tier.slice(1) : ''

  return (
    <aside className="sticky top-0 flex h-screen w-[236px] shrink-0 flex-col gap-7 border-r border-cream/[0.07] bg-ink-deep p-4">
      <Link to="/dashboard" className="block px-2">
        <img src={logo} alt="Convergence MVMNT" className="block h-11 w-auto" />
      </Link>
      <nav className="flex flex-1 flex-col gap-6">
        <NavGroup title="Learn" items={LEARN} active={active} />
        <NavGroup title="Connect" items={CONNECT} active={active} />
        <NavGroup title="Grow" items={GROW} active={active} />
        {isAdmin && <NavGroup title="Admin" items={ADMIN} active={active} />}
      </nav>
      <div className="flex items-center gap-2.5 rounded-[11px] border border-cream/[0.07] bg-cream/[0.04] p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/[0.14] font-sans text-[13px] font-bold text-gold">{initials}</div>
        <div className="min-w-0">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[13.5px] font-semibold tracking-[0.02em]">{displayName}</div>
          <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold">{tierLabel}</div>
        </div>
      </div>
    </aside>
  )
}
