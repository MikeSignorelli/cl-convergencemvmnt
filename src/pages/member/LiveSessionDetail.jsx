import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import logo from '../../assets/images/convergence-mvmnt.png'
import mikePortrait from '../../assets/images/drop-a-portrait-of-mike.webp'
import { useLiveClock } from '../../components/LiveSessionCard'
import { fetchLiveSession, isSessionLive, isSessionPast, formatCountdown } from '../../lib/liveSessions'
import { useAuth } from '../../lib/AuthContext'

function initialsOf(name) {
  if (!name) return '—'
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
}

// Mirrors CourseDetail.jsx's layout (sticky header, hero, left content +
// right sidebar card) so a live session reads as the same kind of page as a
// course instead of a one-off design, per the redesign brief.
export default function LiveSessionDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const now = useLiveClock()

  useEffect(() => {
    let cancelled = false
    fetchLiveSession(id)
      .then((s) => {
        if (cancelled) return
        if (!s) setError('Live session not found.')
        else setSession(s)
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  const live = session && isSessionLive(session, now)
  const past = session && isSessionPast(session, now)
  const scheduled = session ? new Date(session.scheduled_at) : null
  const heroBg = session?.thumbnail_url

  return (
    <div className="min-h-screen bg-ink font-sans text-cream antialiased">
      <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between gap-6 border-b border-cream/[0.07] bg-ink/90 px-6 backdrop-blur-md">
        <Link to="/live-sessions" className="flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/65 no-underline">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Live sessions
        </Link>
        <Link to="/dashboard"><img src={logo} alt="Convergence MVMNT" className="block h-8 w-auto" /></Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/[0.14] font-sans text-[12px] font-bold text-gold">
          {initialsOf(profile?.display_name || profile?.username)}
        </div>
      </header>

      {loading && <p className="px-10 py-14 font-serif text-cream/50">Loading…</p>}
      {!loading && error && <p className="px-10 py-14 font-serif text-[#D8888A]">{error}</p>}

      {!loading && !error && session && (
        <>
          <section className="relative flex min-h-[300px] items-end overflow-hidden border-b border-cream/[0.07]">
            {heroBg ? (
              <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_25%] brightness-[0.4]" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(194,160,100,0.22),transparent_60%)]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,21,12,0.92)_30%,rgba(18,21,12,0.35)_75%),linear-gradient(transparent_45%,rgba(18,21,12,0.9))]" />
            <div className="relative mx-auto w-full max-w-[1400px] px-6 pb-9 pt-14 lg:px-10">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {live ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-[#9BC08A] px-3 py-1 font-sans text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                    Live now
                  </span>
                ) : past ? (
                  <span className="rounded-full bg-ink/70 px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-cream/60">Ended</span>
                ) : (
                  <span className="rounded-full border border-gold/35 bg-gold/[0.16] px-[13px] py-[5px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E9CF9C]">
                    Starts in {formatCountdown(scheduled, now)}
                  </span>
                )}
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/60">
                  {(session.visible_tiers || []).join(', ')}
                </span>
              </div>
              <h1 className="max-w-[760px] text-[clamp(28px,4vw,44px)] font-bold uppercase leading-[1.02] text-white">{session.title}</h1>
              {session.description && (
                <p className="mt-3 max-w-[560px] font-serif text-[15.5px] leading-[1.6] text-cream/[80%]">{session.description}</p>
              )}
            </div>
          </section>

          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-9 px-6 py-10 lg:grid-cols-[1fr_360px] lg:px-10">
            <div className="min-w-0">
              <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)]">
                <div className="relative aspect-video">
                  {session.thumbnail_url ? (
                    <img src={session.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(194,160,100,0.16),rgba(28,34,20,0.4))]">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                        <rect x="2" y="6" width="14" height="12" rx="2" /><path d="m22 8-6 4 6 4V8z" />
                      </svg>
                    </div>
                  )}
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
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3.5">
                    <img src={mikePortrait} alt="Mike Signorelli" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                    <div>
                      <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/45">Hosted by</div>
                      <div className="font-sans text-[16px] font-bold text-white">Mike Signorelli</div>
                    </div>
                  </div>
                  <p className="mt-3.5 font-serif text-[13.5px] leading-[1.6] text-cream/65">
                    Live on Zoom — join from your browser or the Zoom app. No registration needed; the
                    link below opens the meeting directly.
                  </p>
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-[80px] lg:self-start">
              <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/45">Session</span>
                </div>
                <div className="mb-3 flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <div className="font-serif text-[13.5px] text-cream/75">
                    {scheduled.toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
                <div className="mb-5 flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  <div className="font-serif text-[13.5px] text-cream/75">{session.duration_minutes || 60} minutes</div>
                </div>

                {live && session.join_url ? (
                  <a
                    href={session.join_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full border-none bg-gold px-5 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.1em] text-ink no-underline"
                  >
                    Join now
                  </a>
                ) : past ? (
                  <div className="rounded-full border border-cream/[0.14] px-5 py-3 text-center font-sans text-[12.5px] font-semibold uppercase tracking-[0.1em] text-cream/40">
                    This session has ended
                  </div>
                ) : (
                  <div className="rounded-full border border-cream/[0.14] px-5 py-3 text-center font-sans text-[12.5px] font-semibold uppercase tracking-[0.1em] text-cream/50">
                    Starts in {formatCountdown(scheduled, now)}
                  </div>
                )}
                <p className="mt-3 text-center font-serif text-[11.5px] text-cream/40">
                  {live
                    ? 'The meeting opens with no wait for the host.'
                    : past
                      ? 'Check back for the next session.'
                      : "You'll be able to join right at the start time."}
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
