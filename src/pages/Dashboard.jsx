import { useState, useEffect, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTier } from '../context/TierContext'
import { TIERS } from '../data/tiers'
import Logo from '../components/Logo'

/* ─── Icon helpers ─────────────────────────────────────── */
const Icon = ({ d, size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...props}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
)

const HomeIcon   = () => <Icon d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
const CoursesIcon = () => <Icon d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m10 9 5 3-5 3z"/></>} />
const ClockIcon  = () => <Icon d={<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>} />
const DownloadIcon = () => <Icon d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></>} />
const UsersIcon  = () => <Icon d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />
const MessageIcon = () => <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
const FlameIcon  = () => <Icon d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
const ProgressIcon = () => <Icon d={FlameIcon().props.children} />
const SettingsIcon = () => <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></>} />
const BellIcon   = () => <Icon d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>} />
const SearchIcon = () => <Icon d={<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>} />
const PlayIcon   = () => <Icon size={20} d={null}><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></Icon>
const CheckIcon  = () => <Icon size={14} d="M20 6 9 17l-5-5" strokeWidth="2.5" />
const ChevronRightIcon = () => <Icon size={16} d="m9 18 6-6-6-6" />
const SunIcon    = () => <Icon size={20} d={<><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></>} />
const AwardIcon  = () => <Icon size={20} d={<><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>} />
const HamburgerIcon = () => <Icon size={20} d={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>} />

/* ─── Nav items ─────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: 'Learn',
    items: [
      { to: '/dashboard', label: 'Dashboard',     icon: <HomeIcon /> },
      { to: '#',          label: 'Courses',        icon: <CoursesIcon /> },
      { to: '#',          label: 'Live sessions',  icon: <ClockIcon /> },
      { to: '#',          label: 'Resources',      icon: <DownloadIcon /> },
    ],
  },
  {
    label: 'Connect',
    items: [
      { to: '#', label: 'Community', icon: <UsersIcon /> },
      { to: '#', label: 'Messages',  icon: <MessageIcon /> },
    ],
  },
  {
    label: 'Grow',
    items: [
      { to: '#', label: 'My progress', icon: <FlameIcon /> },
      { to: '#', label: 'Settings',    icon: <SettingsIcon /> },
    ],
  },
]

/* ─── Sidebar ───────────────────────────────────────────── */
function Sidebar({ open, onClose, tierData }) {
  const { accent, accentSoft, initials, name, label } = tierData
  return (
    <>
      {/* overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[190] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="db-sidebar"
        className={[
          'no-scrollbar fixed md:sticky top-0 h-screen w-[236px] flex-shrink-0',
          'bg-cv-sidebar border-r border-white/[0.07] flex flex-col gap-7 p-6 z-[200]',
          'transition-[left] duration-[250ms] ease-in-out',
          open ? 'left-0' : '-left-[260px] md:left-0',
        ].join(' ')}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link to="/" aria-label="Convergence MVMNT Home" className="px-2 block">
          <Logo height={44} />
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-6 flex-1 overflow-y-auto no-scrollbar" aria-label="Dashboard navigation">
          {NAV_SECTIONS.map(({ label: sectionLabel, items }) => (
            <div key={sectionLabel} className="flex flex-col gap-0.5">
              <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-cv-text/35 px-3 pb-2">
                {sectionLabel}
              </span>
              {items.map(({ to, label: itemLabel, icon }) => (
                to === '/dashboard' ? (
                  <NavLink
                    key={itemLabel}
                    to={to}
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] font-sans font-semibold text-[13px] tracking-[0.09em] uppercase no-underline transition-colors ${
                        isActive
                          ? 'bg-cv-gold/[0.13] text-cv-gold-lt'
                          : 'text-cv-text/60 hover:text-cv-text hover:bg-white/5'
                      }`
                    }
                    aria-current="page"
                  >
                    {icon}{itemLabel}
                  </NavLink>
                ) : (
                  <a
                    key={itemLabel}
                    href={to}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] font-sans font-medium text-[13px] tracking-[0.09em] uppercase text-cv-text/60 hover:text-cv-text hover:bg-white/5 transition-colors no-underline"
                  >
                    {icon}{itemLabel}
                  </a>
                )
              ))}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="flex items-center gap-3 p-3 rounded-[11px] bg-white/[0.04] border border-white/[0.07]">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-sans font-bold text-[13px] flex-shrink-0 transition-colors"
            style={{ background: accentSoft, color: accent }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-sans font-semibold text-[13.5px] tracking-[0.02em] truncate text-cv-text">
              {name}
            </div>
            <div className="font-sans font-semibold text-[10.5px] tracking-[0.14em] uppercase transition-colors" style={{ color: accent }}>
              {label}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

/* ─── Topbar ────────────────────────────────────────────── */
function Topbar({ onHamburger, tierData }) {
  const { accent, accentSoft, initials, streak } = tierData
  return (
    <header className="sticky top-0 z-40 h-[66px] border-b border-white/[0.07] flex items-center justify-between gap-6 px-8 md:px-8 px-4 bg-cv-bg/90 backdrop-blur-[10px]">
      <button
        className="md:hidden text-cv-text/70 p-2 bg-transparent border-none cursor-pointer"
        onClick={onHamburger}
        aria-label="Toggle navigation"
      >
        <HamburgerIcon />
      </button>

      {/* Search */}
      <div
        className="hidden sm:flex items-center gap-2.5 bg-white/[0.05] border border-white/[0.08] rounded-[9px] px-3.5 py-2.5 w-80 text-cv-text/40"
        role="search" aria-label="Search"
      >
        <SearchIcon />
        <span className="font-sans font-medium text-[13px] tracking-[0.04em]">
          Search courses, posts, people…
        </span>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cv-gold/[0.12] border border-cv-gold/25">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E89147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
          <span className="font-sans font-bold text-[13px] text-cv-gold-lt">{streak}-day streak</span>
        </div>

        {/* Notifications */}
        <button className="relative bg-transparent border-none cursor-pointer text-cv-text/60 p-1.5 hover:text-cv-text transition-colors" aria-label="Notifications">
          <BellIcon />
          <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-cv-orange" aria-hidden="true" />
        </button>

        {/* Avatar */}
        <div
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-sans font-bold text-[12.5px] transition-colors"
          style={{ background: accentSoft, color: accent }}
          aria-hidden="true"
        >
          {initials}
        </div>
      </div>
    </header>
  )
}

/* ─── Role switcher ─────────────────────────────────────── */
function RoleSwitcher({ currentTier, onSetTier, accent }) {
  return (
    <div
      className="flex gap-1 p-1 bg-white/[0.05] border border-white/10 rounded-full"
      role="radiogroup"
      aria-label="Membership role"
    >
      {['disciple', 'leader', 'pastor'].map((r) => {
        const active = r === currentTier
        const t = TIERS[r]
        return (
          <button
            key={r}
            role="radio"
            aria-checked={active}
            onClick={() => onSetTier(r)}
            className="cursor-pointer border-none px-[18px] py-2 rounded-full font-sans font-semibold text-[11px] tracking-[0.12em] uppercase transition-all"
            style={
              active
                ? { background: accent, color: '#171C10' }
                : { background: 'transparent', color: 'rgba(240,238,229,0.6)' }
            }
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Continue watching card ────────────────────────────── */
function ContinueCard({ tierData }) {
  const { accent, course, episode, pct } = tierData
  return (
    <a
      href="#"
      className="block rounded-cv-lg overflow-hidden border border-white/[0.09] bg-cv-card no-underline text-inherit hover:border-white/20 transition-colors"
      aria-label="Continue watching"
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '16/7', background: 'linear-gradient(135deg,#2a3820 0%,#1a2410 50%,#0e1308 100%)' }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent 30%,rgba(18,21,12,0.92))' }} />
        <div className="absolute left-6 bottom-5 right-24">
          <div className="font-sans font-semibold text-[11px] tracking-[0.2em] uppercase mb-2 transition-colors" style={{ color: accent }}>
            Continue watching
          </div>
          <div className="font-sans font-bold text-2xl uppercase leading-[1.05] text-white mb-1">{course}</div>
          <div className="font-serif text-[15.5px] text-cv-text/80">{episode}</div>
        </div>
        <div
          className="absolute right-6 bottom-[22px] w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-[0_12px_28px_-8px_rgba(0,0,0,0.6)] transition-colors"
          style={{ background: accent }}
          aria-hidden="true"
        >
          <PlayIcon />
        </div>
      </div>
      {/* Progress bar */}
      <div className="px-6 py-3.5 flex items-center gap-3.5">
        <div
          className="flex-1 h-[5px] rounded-full overflow-hidden bg-white/10"
          role="progressbar"
          aria-label="Course progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: accent }} />
        </div>
        <span className="font-sans font-semibold text-[12px] tracking-[0.08em] text-cv-text/60 whitespace-nowrap">
          {pct}% complete
        </span>
      </div>
    </a>
  )
}

/* ─── Daily reset card ──────────────────────────────────── */
function DailyCard({ tierData, done, onMarkDone }) {
  const { accent, daily, streakNext } = tierData
  return (
    <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-5 flex items-center gap-4 flex-wrap">
      {/* Thumbnail */}
      <div
        className="w-[78px] h-[78px] rounded-[12px] flex-shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#2e3824,#1a2010)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-white" aria-hidden="true">
          <PlayIcon />
        </div>
      </div>

      <div className="flex-1 min-w-[200px]">
        <div className="font-sans font-semibold text-[10.5px] tracking-[0.18em] uppercase mb-1 transition-colors" style={{ color: accent }}>
          Today's reset · 3 min
        </div>
        <div className="font-sans font-semibold text-[17px] tracking-[0.02em] mb-1">{daily}</div>
        <div className="font-serif text-[14px] text-cv-text/60">
          Keep your streak alive — day {streakNext} is waiting.
        </div>
      </div>

      <div>
        {done ? (
          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-cv-gold/[0.14] border border-cv-gold/30 text-cv-gold-lt font-sans font-semibold text-[12px] tracking-[0.12em] uppercase">
            <CheckIcon />
            Done today
          </div>
        ) : (
          <button
            onClick={onMarkDone}
            className="cursor-pointer border-none px-5 py-3 rounded-full font-sans font-semibold text-[12px] tracking-[0.12em] uppercase transition-all hover:brightness-110"
            style={{ background: accent, color: '#171C10' }}
            aria-label="Mark today's reset as complete"
          >
            Mark complete
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Community card ────────────────────────────────────── */
function CommunityCard({ tierData }) {
  const { accent } = tierData
  const posts = [
    { initials: 'MR', color: '#8FA9BD', colorBg: 'rgba(143,169,189,0.16)', name: 'Marcus R.', time: '2h ago · Intensive', quote: '"Day 12 of the intensive and I\'m finally seeing breakthrough in my relationship with my father…"', likes: 24, replies: 9 },
    { initials: 'KL', color: '#B4737B', colorBg: 'rgba(180,115,123,0.16)', name: 'Kayla L.', time: '5h ago · Open forum', quote: '"Question for the group: How do you handle triggers at work?"', likes: 11, replies: 17 },
  ]
  return (
    <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sans font-bold text-[15px] tracking-[0.1em] uppercase text-white m-0">
          From the community
        </h2>
        <a href="#" className="font-sans font-semibold text-[11.5px] tracking-[0.12em] uppercase no-underline transition-colors hover:brightness-110" style={{ color: accent }}>
          View all →
        </a>
      </div>
      <div className="flex flex-col gap-3.5">
        {posts.map(({ initials, color, colorBg, name, time, quote, likes, replies }) => (
          <div key={name} className="flex gap-3 p-3.5 rounded-[12px] bg-white/[0.03] border border-white/[0.06]">
            <div
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-sans font-bold text-[12px] flex-shrink-0"
              style={{ background: colorBg, color }}
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-sans font-semibold text-[13.5px]">{name}</span>
                <span className="font-sans font-medium text-[11px] text-cv-text/40 tracking-[0.06em]">{time}</span>
              </div>
              <div className="font-serif text-[14.5px] leading-relaxed text-cv-text/78">{quote}</div>
              <div className="flex gap-4 mt-2 font-sans font-semibold text-[11.5px] tracking-[0.06em] text-cv-text/45">
                <span>{likes} likes</span><span>{replies} replies</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Points card ───────────────────────────────────────── */
function PointsCard({ tierData }) {
  const { points, badges } = tierData
  return (
    <a href="#" className="no-underline text-inherit rounded-cv-lg border border-white/[0.09] bg-cv-card p-[18px] flex items-center gap-3 hover:border-white/20 transition-colors">
      <AwardIcon />
      <div className="flex-1">
        <div className="font-sans font-bold text-[17px]">{points} points</div>
        <div className="font-serif text-[12.5px] text-cv-text/55">{badges} badges earned · view progress</div>
      </div>
      <ChevronRightIcon />
    </a>
  )
}

/* ─── Live session card ─────────────────────────────────── */
function LiveCard({ tierData }) {
  const { accent, liveAccentBorder, liveAccentBg, liveTitle, liveDate } = tierData
  return (
    <div
      className="rounded-cv-lg border p-5 transition-all"
      style={{ borderColor: liveAccentBorder, background: liveAccentBg }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full flex-shrink-0 bg-cv-orange" aria-hidden="true" />
        <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-cv-text/55">
          Next live session
        </span>
      </div>
      <div className="font-sans font-bold text-[19px] leading-[1.12] uppercase text-white mb-1.5">{liveTitle}</div>
      <div className="font-serif text-[14.5px] text-cv-text/70 mb-4">
        {liveDate} · with Mike Signorelli
      </div>
      <button
        onClick={() => alert('Added to calendar!')}
        className="w-full cursor-pointer border-none py-3 rounded-full font-sans font-semibold text-[12px] tracking-[0.12em] uppercase transition-all hover:brightness-110"
        style={{ background: accent, color: '#171C10' }}
      >
        Add to calendar
      </button>
    </div>
  )
}

/* ─── Disciple panel ────────────────────────────────────── */
function DisciplePanel({ accent }) {
  return (
    <div className="flex flex-col gap-[22px]">
      {/* Freedom Journey */}
      <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-5">
        <div className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase mb-2.5" style={{ color: accent }}>
          Freedom Journey
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-sans font-bold text-[30px] text-white">Day 12</span>
          <span className="font-sans font-medium text-[14px] text-cv-text/50">of 90</span>
        </div>
        <div className="font-serif text-[13.5px] text-cv-text/62 mb-3.5">Phase 1 · Mapping your patterns</div>
        <div className="h-[6px] rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '13.3%', background: accent }} />
        </div>
      </div>
      {/* Accountability partner */}
      <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-[18px]">
        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-sans font-bold text-[13px] flex-shrink-0" style={{ background: 'rgba(194,160,100,0.14)', color: accent }}>RM</div>
          <div className="flex-1 min-w-0">
            <div className="font-sans font-semibold text-[14px]">Rachel M.</div>
            <div className="font-serif text-[12.5px] text-cv-text/55">Accountability partner · checked in today</div>
          </div>
          <a href="#" className="font-sans font-semibold text-[11px] tracking-[0.1em] uppercase no-underline flex-shrink-0 hover:brightness-110 transition-colors" style={{ color: accent }}>Check in →</a>
        </div>
      </div>
      {/* Hot seat lottery */}
      <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-[18px]">
        <div className="flex items-center gap-3">
          <SunIcon />
          <div className="flex-1">
            <div className="font-sans font-semibold text-[14px]">Hot seat lottery</div>
            <div className="font-serif text-[12.5px] text-cv-text/55">You're entered — drawing this Friday</div>
          </div>
          <span className="px-3 py-1.5 rounded-full font-sans font-semibold text-[10.5px] tracking-[0.12em] uppercase flex-shrink-0" style={{ background: 'rgba(194,160,100,0.14)', border: '1px solid rgba(194,160,100,0.3)', color: '#E9CF9C' }}>
            Entered
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Leader panel ──────────────────────────────────────── */
function LeaderPanel({ accent }) {
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-5">
        <div className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase mb-2.5" style={{ color: accent }}>Path to Significance</div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-sans font-bold text-[30px] text-white">Milestone 4</span>
          <span className="font-sans font-medium text-[14px] text-cv-text/50">of 12</span>
        </div>
        <div className="font-serif text-[13.5px] text-cv-text/62 mb-3.5">Defining your legacy statement</div>
        <div className="h-[6px] rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '33%', background: accent }} />
        </div>
      </div>
      <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-[18px]">
        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-sans font-bold text-[13px] flex-shrink-0" style={{ background: 'rgba(143,169,189,0.16)', color: accent }}>MT</div>
          <div className="flex-1 min-w-0">
            <div className="font-sans font-semibold text-[14px]">Marcus T.</div>
            <div className="font-serif text-[12.5px] text-cv-text/55">Mastermind partner · call Tuesday 7 AM</div>
          </div>
          <a href="#" className="font-sans font-semibold text-[11px] tracking-[0.1em] uppercase no-underline flex-shrink-0 hover:brightness-110 transition-colors" style={{ color: accent }}>Message →</a>
        </div>
      </div>
      <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-[18px]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-sans font-semibold text-[14px]">Boardroom sessions</div>
          <a href="#" className="font-sans font-semibold text-[11px] tracking-[0.1em] uppercase no-underline hover:brightness-110 transition-colors" style={{ color: accent }}>Calendar →</a>
        </div>
        <div className="font-serif text-[13px] text-cv-text/62 leading-[1.55]">Next: Sept 3 · "Scaling without losing your soul"</div>
      </div>
      <div className="rounded-cv-lg border p-[18px] flex items-center gap-3" style={{ borderColor: 'rgba(143,169,189,0.25)', background: 'linear-gradient(160deg,rgba(143,169,189,0.09),rgba(30,36,22,0.4))' }}>
        <div className="flex-1">
          <div className="font-sans font-semibold text-[14px]">Greece Tour 2027</div>
          <div className="font-serif text-[12.5px] text-cv-text/60">Priority booking window is open</div>
        </div>
        <a href="#" className="px-4 py-2.5 rounded-full font-sans font-semibold text-[10.5px] tracking-[0.12em] uppercase no-underline flex-shrink-0 text-cv-bg hover:brightness-110 transition-all" style={{ background: accent }}>Reserve</a>
      </div>
    </div>
  )
}

/* ─── Pastor panel ──────────────────────────────────────── */
function PastorPanel({ accent }) {
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-5">
        <div className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase mb-2.5" style={{ color: accent }}>Current system · Church Systems</div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-sans font-bold text-[30px] text-white">8 templates</span>
          <span className="font-sans font-medium text-[14px] text-cv-text/50">of 24 downloaded</span>
        </div>
        <div className="font-serif text-[13.5px] text-cv-text/62 mb-3.5">Module 3 · Volunteer pipeline</div>
        <div className="h-[6px] rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '33%', background: accent }} />
        </div>
      </div>
      <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-[18px]">
        <div className="flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>
          <div className="flex-1">
            <div className="font-sans font-semibold text-[14px]">Marriage check-in</div>
            <div className="font-serif text-[12.5px] text-cv-text/55">Due Sunday · with Julie</div>
          </div>
          <a href="#" className="font-sans font-semibold text-[11px] tracking-[0.1em] uppercase no-underline flex-shrink-0 hover:brightness-110 transition-colors" style={{ color: accent }}>Start →</a>
        </div>
      </div>
      <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-[18px]">
        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-sans font-bold text-[13px] flex-shrink-0" style={{ background: 'rgba(180,115,123,0.16)', color: accent }}>JT</div>
          <div className="flex-1 min-w-0">
            <div className="font-sans font-semibold text-[14px]">Julie Thompson</div>
            <div className="font-serif text-[12.5px] text-cv-text/55">Spouse access · active</div>
          </div>
          <span className="px-3 py-1.5 rounded-full font-sans font-semibold text-[10.5px] tracking-[0.12em] uppercase flex-shrink-0" style={{ background: 'rgba(180,115,123,0.14)', border: '1px solid rgba(180,115,123,0.32)', color: '#D8A3AA' }}>Active</span>
        </div>
      </div>
      <div className="rounded-cv-lg border border-white/[0.09] bg-cv-card p-[18px]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-sans font-semibold text-[14px]">Northeast cluster</div>
          <a href="#" className="font-sans font-semibold text-[11px] tracking-[0.1em] uppercase no-underline hover:brightness-110 transition-colors" style={{ color: accent }}>Open →</a>
        </div>
        <div className="font-serif text-[13px] text-cv-text/62 leading-[1.55]">14 pastors · next regional call Sept 9</div>
      </div>
    </div>
  )
}

/* ─── Mobile bottom bar ─────────────────────────────────── */
function MobileBar() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-[60px] bg-cv-sidebar border-t border-white/[0.07] flex items-center justify-around px-2"
      aria-label="Mobile navigation"
    >
      {[
        { icon: <HomeIcon />, label: 'Home',      active: true  },
        { icon: <CoursesIcon />, label: 'Courses', active: false },
        { icon: <UsersIcon />, label: 'Community', active: false },
        { icon: <FlameIcon />, label: 'Progress',  active: false },
      ].map(({ icon, label, active }) => (
        <a
          key={label}
          href="#"
          className={`flex flex-col items-center gap-1 no-underline px-3 py-2 font-sans font-semibold text-[9px] tracking-[0.1em] uppercase ${active ? 'text-cv-gold-lt' : 'text-cv-text/50'}`}
          aria-current={active ? 'page' : undefined}
        >
          {icon}
          {label}
        </a>
      ))}
    </nav>
  )
}

/* ─── Main Dashboard page ───────────────────────────────── */
export default function Dashboard() {
  const { tier, setTier } = useTier()
  const [dailyDone, setDailyDone] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const tierData = TIERS[tier] || TIERS.disciple

  // reset dailyDone when role changes
  useEffect(() => { setDailyDone(false) }, [tier])

  // today label
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const d = new Date()
  const todayLabel = `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`

  return (
    <div className="cv-root flex min-h-screen bg-cv-bg text-cv-text font-sans antialiased">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} tierData={tierData} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onHamburger={() => setSidebarOpen(!sidebarOpen)} tierData={tierData} />

        <main className="flex-1 px-8 py-9 pb-16 max-w-[1180px] w-full mx-auto md:px-8 px-4 pb-[80px] md:pb-16">
          {/* Header row */}
          <div className="flex items-center justify-between gap-5 flex-wrap mb-8">
            <div>
              <div className="font-sans font-semibold text-[11px] tracking-[0.2em] uppercase text-cv-text/42 mb-1.5">
                {todayLabel}
              </div>
              <h1 className="font-sans font-bold text-[32px] md:text-[32px] text-[24px] leading-[1.04] tracking-[0.005em] uppercase text-white m-0">
                Welcome back, {tierData.first}
              </h1>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <RoleSwitcher currentTier={tier} onSetTier={setTier} accent={tierData.accent} />
              <Link
                to="/onboarding"
                className="font-sans font-semibold text-[11px] tracking-[0.12em] uppercase text-cv-text/50 no-underline hover:text-cv-text transition-colors"
              >
                Onboarding ↗
              </Link>
            </div>
          </div>

          {/* 2-col grid */}
          <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)] gap-[22px] items-start">
            {/* Left column */}
            <div className="flex flex-col gap-[22px] min-w-0">
              <ContinueCard tierData={tierData} />
              <DailyCard tierData={tierData} done={dailyDone} onMarkDone={() => setDailyDone(true)} />
              <CommunityCard tierData={tierData} />
              <PointsCard tierData={tierData} />
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-[22px] min-w-0">
              <LiveCard tierData={tierData} />
              {tier === 'disciple' && <DisciplePanel accent={tierData.accent} />}
              {tier === 'leader'   && <LeaderPanel   accent={tierData.accent} />}
              {tier === 'pastor'   && <PastorPanel   accent={tierData.accent} />}
            </div>
          </div>
        </main>
      </div>

      <MobileBar />
    </div>
  )
}
