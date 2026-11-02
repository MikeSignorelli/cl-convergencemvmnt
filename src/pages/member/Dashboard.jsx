import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import CourseCard from '../../components/CourseCard'
import { PaymentStatusBadge } from '../../components/PaymentWall'
import { useAuth } from '../../lib/AuthContext'
import { listLiveSessions } from '../../lib/liveSessions'
import { listCourses } from '../../lib/courses'
import { fetchEpisodeCounts } from '../../lib/courseLessons'
import { fetchMyProgress, fetchContinueWatchingCourses } from '../../lib/progress'
import { getCourseAccess } from '../../lib/courseAccess'
import { startCoursePurchase, startMembershipCheckout, confirmCheckout } from '../../lib/billing'
import dailyResetImg from '../../assets/app-images/dashboard-daily-reset.jpg'

const TIERS = {
  disciple: {
    key: 'disciple',
    name: 'Sarah Mitchell',
    first: 'Sarah',
    initials: 'SM',
    label: 'Disciple',
    accent: '#C2A064',
    accentSoft: 'rgba(194,160,100,0.14)',
    streak: 12,
    streakNext: 13,
    course: 'Inherit Your Freedom',
    episode: 'Week 2: Identifying Root Beliefs',
    pct: 34,
    pctW: '34%',
    daily: 'Morning Mindset Reset',
    liveTitle: 'Hot Seat Coaching',
    liveDate: 'Thursday · Aug 27 · 8:00 PM ET',
    points: '1,240',
    badges: 4,
  },
  leader: {
    key: 'leader',
    name: 'David Richardson',
    first: 'David',
    initials: 'DR',
    label: 'Leader',
    accent: '#8FA9BD',
    accentSoft: 'rgba(143,169,189,0.16)',
    streak: 23,
    streakNext: 24,
    course: 'The Breakthrough Protocol',
    episode: "The Leader's Daily Reset",
    pct: 58,
    pctW: '58%',
    daily: "The Leader's Daily Reset",
    liveTitle: 'Boardroom Session',
    liveDate: 'Wednesday · Sept 3 · 12:00 PM ET',
    points: '2,860',
    badges: 7,
  },
  pastor: {
    key: 'pastor',
    name: 'Pastor James Thompson',
    first: 'James',
    initials: 'JT',
    label: 'Pastor',
    accent: '#B4737B',
    accentSoft: 'rgba(180,115,123,0.16)',
    streak: 8,
    streakNext: 9,
    course: 'The Movement: Church Systems',
    episode: 'Module 3 · Volunteer Pipeline',
    pct: 42,
    pctW: '42%',
    daily: 'Morning Mindset Reset',
    liveTitle: 'Regional Cluster Call',
    liveDate: 'Tuesday · Sept 9 · 1:00 PM ET',
    points: '980',
    badges: 3,
  },
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function todayLabel() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

// Human-readable session time for the card + hover tooltip, in the viewer's
// local timezone.
function formatSessionDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Google Calendar wants UTC timestamps as YYYYMMDDTHHMMSSZ.
function toGCalStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

// A Google Calendar "add event" link pre-filled from a real live session.
// There's no duration column (migration 0008), so events default to 60 min.
function googleCalendarUrl(session) {
  const start = new Date(session.scheduled_at)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title || 'Live session',
    dates: `${toGCalStamp(start)}/${toGCalStamp(end)}`,
    details: [session.description, session.join_url ? `Join: ${session.join_url}` : '']
      .filter(Boolean)
      .join('\n\n'),
    location: session.join_url || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Real course grid — every published course, each with its own lock/progress
// state (getCourseAccess), plus a "continue watching" shortlist above it when
// there's anything in progress. Used both for a paying member (real progress,
// no progress bar for admin) and a non-member (every course locked with its
// price + Enroll Now — the whole point being to drive a purchase or
// membership signup right from the dashboard instead of a blanket paywall).
function YourCoursesSection({
  courses,
  loading,
  episodeCounts,
  progressByCourseId,
  continueWatching,
  profile,
  isAdmin,
  purchasedCourseIds,
  onEnroll,
  enrollStatus,
  emptyMessage = 'No courses published yet.',
}) {
  return (
    <section className="mb-[30px]">
      {continueWatching.length > 0 && (
        <div className="mb-7">
          <h2 className="mb-3.5 font-sans text-[15px] font-bold uppercase tracking-[0.1em] text-white">
            Continue watching
          </h2>
          <div className="flex flex-wrap gap-[18px]">
            {continueWatching.map(({ course, percent }) => (
              <CourseCard
                key={course.id}
                course={course}
                access={getCourseAccess({ course, profile, isAdmin, purchasedCourseIds })}
                episodeCount={episodeCounts[course.id]}
                progressPercent={percent}
              />
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3.5 font-sans text-[15px] font-bold uppercase tracking-[0.1em] text-white">Your courses</h2>
      {loading && <p className="font-serif text-cream/50">Loading courses…</p>}
      {!loading && courses.length === 0 && <p className="font-serif text-cream/50">{emptyMessage}</p>}
      {!loading && courses.length > 0 && (
        <div className="flex flex-wrap gap-[18px]">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              access={getCourseAccess({ course, profile, isAdmin, purchasedCourseIds })}
              episodeCount={episodeCounts[course.id]}
              progressPercent={progressByCourseId[course.id] || 0}
              onEnroll={onEnroll}
              enrolling={enrollStatus.id === course.id && enrollStatus.pending}
              enrollError={enrollStatus.id === course.id ? enrollStatus.error : ''}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default function Dashboard() {
  const { profile, isAdmin, previewTier, setPreviewTier, hasAnyPurchase, purchasedCourseIds, refreshProfile } = useAuth()
  const tier = isAdmin ? previewTier || 'disciple' : profile?.tier || 'disciple'
  const readOnly = isAdmin
  const [dailyDone, setDailyDone] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const checkoutStatus = searchParams.get('checkout')
  // Snapshotted once so the banner survives the query param being cleared
  // right after (see the effect below).
  const [checkoutBanner] = useState(checkoutStatus)

  // Membership checkout lands back here (its cancel_url/success_url both
  // default to /dashboard) — previously with no acknowledgment at all, so a
  // cancelled non-member just saw the same locked dashboard with no sense
  // anything happened. On success, re-check the profile a couple of times
  // since the webhook that flips subscription_status to 'active' can land a
  // second or two after Stripe's own redirect does.
  useEffect(() => {
    if (!checkoutStatus) return
    // Read before the query param is stripped below.
    const sessionId = searchParams.get('session_id')
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('checkout')
        next.delete('session_id')
        return next
      },
      { replace: true }
    )
    if (checkoutStatus === 'success') {
      // Activates the membership directly when no Stripe webhook endpoint is
      // configured — otherwise nothing ever flips subscription_status and the
      // re-checks below just find 'pending' three times. Silent on failure:
      // where a webhook does exist it has already done this.
      confirmCheckout(sessionId)
        .then((result) => {
          if (result?.confirmed) refreshProfile()
        })
        .catch((err) => console.error('confirm-checkout failed; relying on webhook', err))

      refreshProfile()
      const t1 = setTimeout(refreshProfile, 2500)
      const t2 = setTimeout(refreshProfile, 6000)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [checkoutStatus])
  const t = TIERS[tier]
  const firstName = (profile?.display_name || profile?.username || t.first).trim().split(/\s+/)[0]
  const freedomDay = t.streak
  const freedomPctW = `${((t.streak / 90) * 100).toFixed(1)}%`

  // Dashboard content is the membership paywall — admins always pass
  // through (they don't hold a subscription), everyone else needs
  // subscription_status === 'active' (see migration 0011 / Stripe webhook).
  const hasPaidAccess = isAdmin || profile?.subscription_status === 'active' || hasAnyPurchase

  // Next upcoming live session, read from real data (RLS already scopes
  // live_sessions to the member's tier). listLiveSessions is sorted ascending
  // by scheduled_at, so the first future one is the soonest.
  const [nextSession, setNextSession] = useState(null)
  useEffect(() => {
    let cancelled = false
    listLiveSessions()
      .then((rows) => {
        if (cancelled) return
        const now = Date.now()
        const upcoming = (rows || []).filter((s) => new Date(s.scheduled_at).getTime() > now)
        setNextSession(upcoming[0] || null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Every course, real per-course progress, and a "continue watching"
  // shortlist — the dashboard used to show only the single most-recently-
  // watched episode and hide every other course (including finished ones).
  // Admin never gets progress rows at all (no bar, ever, for that role).
  const [courses, setCourses] = useState([])
  const [episodeCounts, setEpisodeCounts] = useState({})
  const [progressByCourseId, setProgressByCourseId] = useState({})
  const [continueWatchingItems, setContinueWatchingItems] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  // One object rather than two separate states: clearing enrollingId on
  // error also blanked the error message that was keyed off it, so it never
  // actually rendered.
  const [enrollStatus, setEnrollStatus] = useState({ id: null, pending: false, error: '' })
  const [joinMembership, setJoinMembership] = useState({ pending: false, error: '' })

  useEffect(() => {
    let cancelled = false

    async function loadProgress() {
      if (isAdmin) return
      try {
        const mine = await fetchMyProgress()
        if (cancelled) return
        const map = {}
        for (const entry of [...(mine.inProgress || []), ...(mine.completed || []), ...(mine.notStarted || [])]) {
          map[entry.courseId] = entry.percent
        }
        setProgressByCourseId(map)
      } catch {
        /* cards just show without a progress bar/percent */
      }
      try {
        const items = await fetchContinueWatchingCourses(4)
        if (!cancelled) setContinueWatchingItems(items)
      } catch {
        /* continue-watching row just stays empty */
      }
    }

    async function load() {
      try {
        const courseList = await listCourses()
        if (!cancelled) setCourses(courseList)
      } catch {
        /* course grid just stays empty on failure — the rest of the dashboard still works */
      } finally {
        if (!cancelled) setCoursesLoading(false)
      }
      try {
        const counts = await fetchEpisodeCounts()
        if (!cancelled) setEpisodeCounts(counts)
      } catch {
        /* cards just show without an episode count */
      }
      await loadProgress()
    }
    load()

    function handleVisibilityOrFocus() {
      if (document.visibilityState === 'visible') loadProgress()
    }
    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
    }
  }, [isAdmin])

  // The dashboard is "your courses", not the full catalog — a paid member
  // only sees what's actually assigned to their role (or individually
  // purchased outside it). Browsing everything else, locked, still lives on
  // /courses and /programs. Admin keeps seeing every course (there's no
  // "assigned" role to filter by when you can manage all of them), and a
  // non-member still sees the full catalog with price/Enroll — that's their
  // only path to ever get an assigned course.
  const visibleCourses = useMemo(() => {
    if (isAdmin || !hasPaidAccess) return courses
    return courses.filter((c) => getCourseAccess({ course: c, profile, isAdmin, purchasedCourseIds }).unlocked)
  }, [courses, isAdmin, hasPaidAccess, profile, purchasedCourseIds])

  const continueWatchingResolved = useMemo(
    () =>
      continueWatchingItems
        .map((item) => {
          const course = courses.find((c) => c.id === item.courseId)
          if (!course) return null
          // Same "assigned only" rule as the grid above — if access lapsed
          // since this was last watched, it drops out of Continue Watching
          // rather than showing up locked with an Enroll button here.
          if (!isAdmin && hasPaidAccess && !getCourseAccess({ course, profile, isAdmin, purchasedCourseIds }).unlocked) return null
          return { course, percent: item.percent }
        })
        .filter(Boolean),
    [continueWatchingItems, courses, isAdmin, hasPaidAccess, profile, purchasedCourseIds]
  )

  function handleEnroll(courseId) {
    setEnrollStatus({ id: courseId, pending: true, error: '' })
    startCoursePurchase(courseId).catch((err) => {
      setEnrollStatus({ id: courseId, pending: false, error: err.message || 'Could not start checkout. Please try again.' })
    })
  }

  // Upgrade path for someone who bought a course outright but never
  // subscribed — they already have an account, so this goes straight to
  // Stripe, no onboarding wizard involved. A completed course purchase is
  // untouched by this: subscription checkouts only ever write to profiles,
  // course_purchases is a separate table (see stripe-webhook).
  function handleJoinMembership() {
    setJoinMembership({ pending: true, error: '' })
    startMembershipCheckout('/dashboard').catch((err) => {
      setJoinMembership({ pending: false, error: err.message || 'Could not start checkout. Please try again.' })
    })
  }

  // Real session when one exists; otherwise the demo teaser stays, but the
  // button is disabled — it only ever adds a real, scheduled event.
  const liveTitle = nextSession ? nextSession.title : t.liveTitle
  const liveWhen = nextSession ? formatSessionDate(nextSession.scheduled_at) : t.liveDate
  const canAddToCalendar = !readOnly && !!nextSession

  // Persistent header CTA for anyone who isn't an active member yet —
  // whether they've bought a standalone course or not — so it's reachable
  // without scrolling. Never shown to admins (they don't hold a
  // subscription) or to an already-active member.
  const showJoinMembershipCTA = !isAdmin && profile?.subscription_status !== 'active'

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/dashboard" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar
          streak={t.streak}
          actionLabel={showJoinMembershipCTA ? (joinMembership.pending ? 'Redirecting…' : 'Join the Movement') : undefined}
          actionOnClick={showJoinMembershipCTA ? handleJoinMembership : undefined}
          actionDisabled={joinMembership.pending}
        />

        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <div className="mb-[30px] flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-cream/[42%]">
                {todayLabel()}
              </div>
              <h1 className="m-0 font-sans text-[32px] font-bold uppercase leading-[1.04] tracking-[0.005em] text-white">
                Welcome back, {firstName}
              </h1>
              {!isAdmin && (
                <div className="mt-2">
                  <PaymentStatusBadge status={profile?.subscription_status} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {isAdmin && (
                <div className="flex gap-1 rounded-full border border-cream/10 bg-cream/5 p-1">
                  {Object.values(TIERS).map((tv) => {
                    const active = tv.key === tier
                    return (
                      <button
                        key={tv.key}
                        type="button"
                        onClick={() => setPreviewTier(tv.key)}
                        className="rounded-full px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={
                          active
                            ? { background: t.accent, color: '#171C10' }
                            : { background: 'transparent', color: 'rgba(240,238,229,0.6)' }
                        }
                      >
                        {tv.label}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3.5">
                <Link
                  to="/onboarding"
                  className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50 no-underline hover:text-cream/80"
                >
                  Onboarding ↗
                </Link>
                <a
                  href="#"
                  className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50 no-underline hover:text-cream/80"
                >
                  Mobile app ↗
                </a>
              </div>
            </div>
          </div>

          {checkoutBanner === 'cancelled' && !hasPaidAccess && (
            <div className="mb-[22px] rounded-cv-lg border border-gold/25 bg-gold/[0.08] px-5 py-3.5">
              <span className="font-sans text-[13px] font-semibold text-[#E9CF9C]">
                Payment cancelled — you weren&rsquo;t charged. Pick a course below to buy it individually, or join the membership to unlock everything for your role.
              </span>
            </div>
          )}
          {checkoutBanner === 'success' && (
            <div className="mb-[22px] rounded-cv-lg border border-[#9BC08A]/30 bg-[#9BC08A]/[0.08] px-5 py-3.5">
              <span className="font-sans text-[13px] font-semibold text-[#9BC08A]">
                Payment received — activating your membership now. If it&rsquo;s not reflected in a few seconds, refresh the page.
              </span>
            </div>
          )}

          {/* Recovery nudge: paid, but profile step never finished (see FinishSetup / task A8). */}
          {hasPaidAccess && !isAdmin && !profile?.display_name && (
            <div className="mb-[22px] flex flex-wrap items-center justify-between gap-3 rounded-cv-lg border border-gold/30 bg-gold/[0.08] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E9CF9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#E9CF9C]">
                  Your membership is active — finish setting up your profile
                </span>
              </div>
              <Link
                to="/finish-setup"
                className="shrink-0 rounded-full bg-gold px-5 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink no-underline"
              >
                Finish setup →
              </Link>
            </div>
          )}

          {readOnly && (
            <div className="mb-[22px] flex items-center gap-2.5 rounded-cv-lg border border-gold/25 bg-gold/[0.08] px-5 py-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E9CF9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#E9CF9C]">
                Read-only preview — viewing the {t.label} experience as admin
              </span>
            </div>
          )}

          <YourCoursesSection
            courses={visibleCourses}
            loading={coursesLoading}
            episodeCounts={episodeCounts}
            progressByCourseId={progressByCourseId}
            continueWatching={continueWatchingResolved}
            emptyMessage={
              !isAdmin && hasPaidAccess && courses.length > 0
                ? 'No courses assigned to your role yet — browse the full library in Courses.'
                : 'No courses published yet.'
            }
            profile={profile}
            isAdmin={isAdmin}
            purchasedCourseIds={purchasedCourseIds}
            onEnroll={handleEnroll}
            enrollStatus={enrollStatus}
          />

          {!hasPaidAccess && (
            <div className="mb-[22px] flex flex-wrap items-center justify-between gap-4 rounded-cv-lg border border-gold/30 bg-gold/[0.08] px-6 py-5">
              <div>
                <div className="mb-1 font-sans text-[15px] font-bold uppercase tracking-[0.05em] text-white">
                  Get every course, live sessions, and the full community
                </div>
                <div className="font-serif text-[13.5px] text-cream/65">
                  Membership includes everything for your role at $49/mo — or buy just one course above.
                </div>
              </div>
              <Link
                to="/membership"
                className="shrink-0 rounded-full bg-gold px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-ink no-underline"
              >
                See membership →
              </Link>
            </div>
          )}

          {/* Single-course owner (already has hasPaidAccess via hasAnyPurchase,
              so the banner above never shows them) — upgrade path to full
              membership. */}
          {hasAnyPurchase && !isAdmin && profile?.subscription_status !== 'active' && (
            <div className="mb-[22px] flex flex-wrap items-center justify-between gap-4 rounded-cv-lg border border-gold/30 bg-gold/[0.08] px-6 py-5">
              <div>
                <div className="mb-1 font-sans text-[15px] font-bold uppercase tracking-[0.05em] text-white">
                  Want everything, not just what you&rsquo;ve bought?
                </div>
                <div className="font-serif text-[13.5px] text-cream/65">
                  Join membership for $49/mo — every course, live sessions, and the full community. Your purchases stay yours.
                </div>
                {joinMembership.error && (
                  <div className="mt-2 font-serif text-[13px] text-[#D8888A]">{joinMembership.error}</div>
                )}
              </div>
              <button
                type="button"
                onClick={handleJoinMembership}
                disabled={joinMembership.pending}
                className="shrink-0 cursor-pointer rounded-full border-none bg-gold px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {joinMembership.pending ? 'Redirecting…' : 'Join membership →'}
              </button>
            </div>
          )}

          {hasPaidAccess && (
          <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)] items-start gap-[22px]">
            {/* Left column */}
            <div className="flex min-w-0 flex-col gap-[22px]">
              <div className="flex flex-wrap items-center gap-[18px] rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-5">
                <div className="relative h-[78px] w-[78px] shrink-0 overflow-hidden rounded-xl">
                  <img
                    src={dailyResetImg}
                    alt=""
                    className="block h-full w-full object-cover"
                    style={{ filter: 'brightness(0.8)' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="min-w-[200px] flex-1">
                  <div
                    className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: t.accent }}
                  >
                    Today's reset · 3 min
                  </div>
                  <div className="mb-0.5 font-sans text-[17px] font-semibold tracking-[0.02em]">
                    {t.daily}
                  </div>
                  <div className="font-serif text-sm text-cream/60">
                    Keep your streak alive — day {t.streakNext} is waiting.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDailyDone(true)}
                  disabled={dailyDone || readOnly}
                  className="rounded-full px-[22px] py-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] disabled:cursor-default"
                  style={{
                    background: dailyDone || readOnly ? 'rgba(240,238,229,0.12)' : t.accent,
                    color: dailyDone || readOnly ? 'rgba(240,238,229,0.6)' : '#171C10',
                  }}
                >
                  {dailyDone ? 'Completed' : 'Mark complete'}
                </button>
              </div>

              <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-[22px]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="m-0 font-sans text-[15px] font-bold uppercase tracking-[0.1em] text-white">
                    From the community
                  </h2>
                  <a
                    href="#"
                    className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.12em] text-gold no-underline"
                  >
                    View all →
                  </a>
                </div>
                <div className="flex flex-col gap-3.5">
                  <div className="flex gap-3 rounded-xl border border-cream/[0.06] bg-cream/[0.03] px-4 py-3.5">
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[rgba(143,169,189,0.16)] font-sans text-xs font-bold text-[#8FA9BD]">
                      MR
                    </div>
                    <div className="min-w-0">
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span className="font-sans text-[13.5px] font-semibold">Marcus R.</span>
                        <span className="font-sans text-[11px] font-medium tracking-[0.06em] text-cream/40">
                          2h ago · Intensive
                        </span>
                      </div>
                      <div className="font-serif text-[14.5px] leading-[1.5] text-cream/[78%]">
                        "Day 12 of the intensive and I'm finally seeing breakthrough in my relationship with my father…"
                      </div>
                      <div className="mt-2 flex gap-4 font-sans text-[11.5px] font-semibold tracking-[0.06em] text-cream/45">
                        <span>24 likes</span>
                        <span>9 replies</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-cream/[0.06] bg-cream/[0.03] px-4 py-3.5">
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[rgba(180,115,123,0.16)] font-sans text-xs font-bold text-[#B4737B]">
                      KL
                    </div>
                    <div className="min-w-0">
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span className="font-sans text-[13.5px] font-semibold">Kayla L.</span>
                        <span className="font-sans text-[11px] font-medium tracking-[0.06em] text-cream/40">
                          5h ago · Open forum
                        </span>
                      </div>
                      <div className="font-serif text-[14.5px] leading-[1.5] text-cream/[78%]">
                        "Question for the group: How do you handle triggers at work?"
                      </div>
                      <div className="mt-2 flex gap-4 font-sans text-[11.5px] font-semibold tracking-[0.06em] text-cream/45">
                        <span>11 likes</span>
                        <span>17 replies</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="flex min-w-0 flex-col gap-[22px]">
              <div
                className="rounded-cv-lg border px-[22px] py-5"
                style={{
                  borderColor: hexToRgba(t.accent, 0.22),
                  background: `linear-gradient(160deg, ${hexToRgba(t.accent, 0.1)}, rgba(30,36,22,0.4))`,
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#E89147]" />
                  <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-cream/55">
                    Next live session
                  </span>
                </div>
                <div className="mb-1.5 font-sans text-[19px] font-bold uppercase leading-[1.12] text-white">
                  {liveTitle}
                </div>
                <div className="mb-4 font-serif text-[14.5px] text-cream/70">
                  {liveWhen} · with Mike Signorelli
                </div>
                {/* Deliberately NOT `disabled` — a disabled button suppresses
                    hover tooltips and clicks entirely, which reads as broken.
                    Instead it's always hoverable and only acts when there's a
                    real upcoming session. */}
                <button
                  type="button"
                  title={
                    readOnly
                      ? 'Preview mode — add to calendar is off while previewing a tier'
                      : nextSession
                        ? `Add “${liveTitle}” to your calendar · ${liveWhen}`
                        : 'No upcoming live session scheduled yet'
                  }
                  onClick={
                    canAddToCalendar
                      ? () => window.open(googleCalendarUrl(nextSession), '_blank', 'noopener,noreferrer')
                      : undefined
                  }
                  className="w-full rounded-full py-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] transition hover:brightness-95"
                  style={{
                    background: t.accent,
                    color: '#171C10',
                    opacity: canAddToCalendar ? 1 : 0.55,
                    cursor: canAddToCalendar ? 'pointer' : 'default',
                  }}
                >
                  Add to calendar
                </button>
              </div>

              <div className="flex flex-col gap-[22px]">
                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-[22px] py-5">
                  <div
                    className="mb-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: t.accent }}
                  >
                    Freedom Journey
                  </div>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="font-sans text-[30px] font-bold text-white">Day {freedomDay}</span>
                    <span className="font-sans text-sm font-medium text-cream/50">of 90</span>
                  </div>
                  <div className="mb-3.5 font-serif text-[13.5px] text-cream/[62%]">
                    Phase 1 · Mapping your patterns
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-cream/10">
                    <div
                      className="h-full rounded-full"
                      style={{ background: t.accent, width: freedomPctW }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-[22px] py-[18px]">
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full font-sans text-[13px] font-bold" style={{ background: t.accentSoft, color: t.accent }}>
                    RM
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-sans text-sm font-semibold">Rachel M.</div>
                    <div className="font-serif text-[12.5px] text-cream/55">
                      Accountability partner · checked in today
                    </div>
                  </div>
                  <a
                    href="#"
                    onClick={(e) => readOnly && e.preventDefault()}
                    aria-disabled={readOnly}
                    className={`shrink-0 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] no-underline ${readOnly ? 'pointer-events-none opacity-50' : ''}`}
                    style={{ color: t.accent }}
                  >
                    Check in →
                  </a>
                </div>

                <div className="flex items-center gap-3 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-[22px] py-[18px]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={t.accent}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <path d="M12 2v4" />
                    <path d="m6.4 6.4 2.8 2.8" />
                    <path d="M2 12h4" />
                    <path d="m6.4 17.6 2.8-2.8" />
                    <path d="M12 22v-4" />
                    <path d="m17.6 17.6-2.8-2.8" />
                    <path d="M22 12h-4" />
                    <path d="m17.6 6.4-2.8 2.8" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-sans text-sm font-semibold">Hot seat lottery</div>
                    <div className="font-serif text-[12.5px] text-cream/55">
                      You're entered — drawing this Friday
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-3 py-1.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      background: t.accentSoft,
                      border: `1px solid ${hexToRgba(t.accent, 0.3)}`,
                      color: '#E9CF9C',
                    }}
                  >
                    Entered
                  </span>
                </div>
              </div>

              {!isAdmin && (
                <Link
                  to="/progress"
                  className="flex items-center gap-3 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-[22px] py-[18px] text-inherit no-underline"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E89147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-sans text-[17px] font-bold">{t.points} points</div>
                    <div className="font-serif text-[12.5px] text-cream/55">
                      {t.badges} badges earned · view progress
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(240,238,229,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
          )}
        </main>
      </div>
    </div>
  )
}
