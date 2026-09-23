import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isSessionLive, isSessionPast, formatCountdown } from '../lib/liveSessions'

// Mirrors CourseCard's visual language (300px card, aspect-video thumbnail
// with a gradient + title overlay) so Live Sessions reads as the same
// platform instead of a separate, older-looking table. There's no lock
// state here — RLS already only ever returns sessions visible to the
// viewer's tier (or all of them for admin), so every card shown is one they
// can actually join.
export default function LiveSessionCard({ session, now, onDelete }) {
  const live = isSessionLive(session, now)
  const past = isSessionPast(session, now)
  const scheduled = new Date(session.scheduled_at)

  return (
    <Link to={`/live-sessions/${session.id}`} className="block w-[300px] shrink-0 text-inherit no-underline">
      <div className="relative mb-2.5 aspect-video overflow-hidden rounded-xl border border-cream/[0.09] bg-[rgb(30,36,22)]">
        {onDelete && (
          <button
            type="button"
            title="Delete session"
            aria-label="Delete session"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(session)
            }}
            className="absolute right-3 top-3 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-ink/70 text-[#D8888A] hover:bg-ink/90"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
            </svg>
          </button>
        )}
        {session.thumbnail_url ? (
          <img
            src={session.thumbnail_url}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${past ? 'brightness-[0.45] grayscale' : 'brightness-[0.7]'}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(194,160,100,0.16),rgba(28,34,20,0.4))]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
              <rect x="2" y="6" width="14" height="12" rx="2" />
              <path d="m22 8-6 4 6 4V8z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_40%,rgba(10,13,7,0.85))]" />

        <div className="absolute left-3 top-3">
          {live ? (
            <span className="flex items-center gap-1.5 rounded-full bg-[#9BC08A] px-3 py-1 font-sans text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-ink" />
              Live now
            </span>
          ) : past ? (
            <span className="rounded-full bg-ink/70 px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-cream/60">
              Ended
            </span>
          ) : (
            <span className="rounded-full border border-gold/30 bg-ink/75 px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-gold">
              Starts in {formatCountdown(scheduled, now)}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3.5 right-3.5 text-base font-bold uppercase leading-[1.05] text-white">
          {session.title}
        </div>
      </div>

      <div className="text-xs font-semibold tracking-[0.06em] text-cream/55">
        {scheduled.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        {' · '}
        {session.duration_minutes || 60} min
      </div>
    </Link>
  )
}

// Ticks `now` every second while at least one card in view is within an
// hour of starting (so the countdown genuinely counts down there), else
// every 30s — cheap enough to just always run at 1s and let React bail out
// on unchanged renders elsewhere; kept as a hook so both the card grid and
// the detail page share one clock instead of drifting independently.
export function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}
