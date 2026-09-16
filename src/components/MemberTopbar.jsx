import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

function initialsOf(name) {
  if (!name) return ''
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
}

export default function MemberTopbar({
  searchPlaceholder = 'Search courses, posts, people…',
  search,
  onSearch,
  streak = 12,
  actionLabel,
  actionOnClick,
}) {
  const { profile } = useAuth()
  const initials = initialsOf(profile?.display_name || profile?.username) || '—'

  // Controlled by the page when it passes onSearch (so it can filter its list);
  // otherwise the box still works locally so it never feels dead.
  const [localSearch, setLocalSearch] = useState('')
  const controlled = typeof onSearch === 'function'
  const value = controlled ? (search ?? '') : localSearch
  const setValue = controlled ? onSearch : setLocalSearch

  return (
    <header className="sticky top-0 z-40 flex h-[66px] items-center justify-between gap-6 border-b border-cream/[0.07] bg-ink/90 px-8 backdrop-blur-md">
      <div className="flex w-80 items-center gap-2.5 rounded-lg border border-cream/[0.08] bg-cream/5 px-3.5 py-2.5 text-cream/40 focus-within:border-gold/40">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full border-none bg-transparent font-sans text-[13px] font-medium tracking-[0.04em] text-cream outline-none placeholder:text-cream/40"
        />
        {value && (
          <button type="button" onClick={() => setValue('')} aria-label="Clear search" className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-cream/40 hover:text-cream/70">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-4.5">
        {actionLabel && (
          <button
            type="button"
            onClick={actionOnClick}
            className="flex cursor-pointer items-center gap-2 rounded-full border-none bg-gold px-5 py-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {actionLabel}
          </button>
        )}
        <div className="flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.12] px-3.5 py-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E89147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
          <span className="font-sans text-[13px] font-bold text-[#E9CF9C]">{streak}-day streak</span>
        </div>
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gold/[0.14] font-sans text-[12.5px] font-bold text-gold">{initials}</div>
      </div>
    </header>
  )
}
