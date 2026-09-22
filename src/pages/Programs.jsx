import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import { useAuth } from '../lib/AuthContext'
import { listCourses } from '../lib/courses'
import { fetchEpisodeCounts } from '../lib/courseLessons'
import { fetchMyProgress, fetchContinueWatchingCourses } from '../lib/progress'
import { getCourseAccess, roleBadgeLabel } from '../lib/courseAccess'
import { startCoursePurchase, formatPrice } from '../lib/billing'

// No real per-course photography exists yet (every file in app-images/ turned
// out to be the same two generic headshots relabeled) — showing those as
// "course thumbnails" read as a bug (same face on every card) rather than
// content. A plain gradient + icon is the honest placeholder until real
// thumbnails are uploaded per course (see admin's Upload Courses page).
function PlaceholderArt() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(194,160,100,0.16),rgba(28,34,20,0.4))]">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        <circle cx="12" cy="12" r="9.25" />
        <path d="M10 8.5v7l6-3.5z" fill="#C2A064" stroke="none" />
      </svg>
    </div>
  )
}

// This page's own card design (bigger, description-forward — the public
// "shop all" look) rather than the member area's compact CourseCard. It
// adapts per viewer: unlocked (real access, from getCourseAccess) shows real
// progress + a Continue/Start link into the course; locked shows the price +
// Enroll now, same as a logged-out visitor sees, plus a role badge when the
// course is assigned to specific role(s) (see lib/courseAccess.js).
function ProgramCard({ course, access, episodeCount, progressPercent = 0, onEnroll, enrolling, enrollError, promptForAccountId }) {
  const { unlocked, showProgress, reason } = access
  const completed = showProgress && progressPercent >= 100
  const openToAllRoles = (course.visible_tiers || []).length >= 3
  const roleLabel = openToAllRoles
    ? null
    : reason === 'wrong_role'
      ? `${roleBadgeLabel(course.visible_tiers)} only`
      : roleBadgeLabel(course.visible_tiers)
  const canEnroll = !unlocked && course.price_cents > 0
  const showPrompt = promptForAccountId === course.id

  return (
    <div className="flex flex-col overflow-hidden rounded-[14px] border border-gold/[0.14] bg-card transition-transform hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <PlaceholderArt />
        )}
        {course.category && (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-ink/80 px-3 py-1.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-cream-solid">
            {course.category}
          </span>
        )}
        {!unlocked && roleLabel && (
          <span className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full border border-gold/25 bg-ink/80 px-3 py-1.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-gold">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {roleLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h3 className="mb-2 font-sans text-xl font-bold uppercase tracking-[0.01em] text-cream-solid">{course.title}</h3>
        {course.duration_label && (
          <div className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-gold">{course.duration_label}</div>
        )}
        {course.description && (
          <p className="mb-6 flex-1 font-serif text-[15px] leading-[1.58] text-cream/65">{course.description}</p>
        )}

        {showProgress && (
          <div className="mb-4 flex items-center gap-2.5">
            <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-cream/15">
              <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, progressPercent)}%` }} />
            </div>
            <span className="shrink-0 font-sans text-[11.5px] font-semibold tabular-nums text-gold">
              {completed ? 'Completed ✓' : `${progressPercent}%`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          {unlocked ? (
            <Link
              to={`/courses/${course.id}`}
              className="cursor-pointer rounded-full border-none bg-gold px-6 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em] text-ink no-underline"
            >
              {completed ? 'Watch again' : progressPercent > 0 ? 'Continue watching' : 'Start watching'}
            </Link>
          ) : (
            <>
              <div className="font-sans text-2xl font-bold text-cream-solid">{formatPrice(course.price_cents)}</div>
              {canEnroll ? (
                <button
                  type="button"
                  onClick={() => onEnroll(course.id)}
                  disabled={enrolling}
                  className="cursor-pointer rounded-full border-none bg-gold px-6 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enrolling ? 'Redirecting…' : 'Enroll now'}
                </button>
              ) : (
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-cream/40">Not sold individually</span>
              )}
            </>
          )}
        </div>
        {showPrompt && (
          <p className="mt-3 font-serif text-[13px] text-[#D8888A]">
            Create a free account or log in first, then come back to enroll.
          </p>
        )}
        {enrollError && (
          <p className="mt-3 font-serif text-[13px] text-[#D8888A]">{enrollError}</p>
        )}
      </div>
    </div>
  )
}

// The public "shop all" courses page — same content and features whether
// you're signed in or not, always in the public site's own layout/nav
// (PublicNav already adapts its Login/Dashboard CTA to session state on its
// own). Signed in, cards show real progress and a Continue/Start link
// instead of price + Enroll for whatever's already unlocked (role match or
// a past purchase — see lib/courseAccess.js); everything else still shows
// price + Enroll, same as a logged-out visitor sees. This intentionally does
// NOT switch to the member app shell (sidebar/topbar) — this route stays
// part of the marketing site, reachable without an account, matching
// demo.convergencemvmnt.com/programs.
export default function Programs() {
  const { session, profile, isAdmin, purchasedCourseIds } = useAuth()
  const [courses, setCourses] = useState([])
  const [episodeCounts, setEpisodeCounts] = useState({})
  const [progressByCourseId, setProgressByCourseId] = useState({})
  const [continueWatchingItems, setContinueWatchingItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  // One object rather than two separate pieces of state: keeping "which
  // course is mid-checkout" and "which course's checkout just failed" in
  // sync as two states meant clearing one on error blanked the other's
  // rendered message before it ever showed.
  const [enrollStatus, setEnrollStatus] = useState({ id: null, pending: false, error: '' })
  const [promptForAccountId, setPromptForAccountId] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const list = await listCourses()
        if (!cancelled) setCourses(list)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
      try {
        const counts = await fetchEpisodeCounts()
        if (!cancelled) setEpisodeCounts(counts)
      } catch {
        /* cards just show without an episode count */
      }
      if (session) {
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
          const items = await fetchContinueWatchingCourses(6)
          if (!cancelled) setContinueWatchingItems(items)
        } catch {
          /* continue-watching row just stays empty */
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session])

  const categories = useMemo(() => {
    const seen = []
    for (const c of courses) {
      const cat = c.category || 'More courses'
      if (!seen.includes(cat)) seen.push(cat)
    }
    return seen
  }, [courses])

  const filteredCourses = useMemo(
    () => (activeCategory === 'All' ? courses : courses.filter((c) => (c.category || 'More courses') === activeCategory)),
    [courses, activeCategory]
  )

  const continueWatchingResolved = useMemo(
    () =>
      continueWatchingItems
        .map((item) => {
          const course = courses.find((c) => c.id === item.courseId)
          return course ? { course, percent: item.percent } : null
        })
        .filter(Boolean),
    [continueWatchingItems, courses]
  )

  function handleEnroll(courseId) {
    if (!session) {
      setPromptForAccountId(courseId)
      return
    }
    setEnrollStatus({ id: courseId, pending: true, error: '' })
    startCoursePurchase(courseId).catch((err) => {
      setEnrollStatus({ id: courseId, pending: false, error: err.message || 'Could not start checkout. Please try again.' })
    })
  }

  function renderCard(course) {
    return (
      <ProgramCard
        key={course.id}
        course={course}
        access={getCourseAccess({ course, profile, isAdmin, purchasedCourseIds })}
        episodeCount={episodeCounts[course.id]}
        progressPercent={progressByCourseId[course.id] || 0}
        onEnroll={handleEnroll}
        enrolling={enrollStatus.id === course.id && enrollStatus.pending}
        enrollError={enrollStatus.id === course.id ? enrollStatus.error : ''}
        promptForAccountId={promptForAccountId}
      />
    )
  }

  return (
    <PublicLayout page="/programs">
      {/* Hero */}
      <header id="top" className="relative overflow-hidden bg-ink">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(78%_70%_at_18%_4%,rgba(194,160,100,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-[820px] px-8 py-24 text-center">
          <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Courses &amp; Mentorship</div>
          <h1 className="mb-6 font-sans text-[40px] font-bold uppercase leading-[0.98] tracking-[0.005em] text-white sm:text-[50px]">
            Structured programs for when you&rsquo;re ready to go all in.
          </h1>
          <p className="mx-auto max-w-[560px] font-serif text-lg leading-[1.6] text-cream/[74%]">
            Not ready to subscribe? Buy access to a single program outright — same teaching, same
            depth, yours to keep. Membership at $49/mo still includes every course below at no
            extra cost.
          </p>
          <Link to="/membership" className="mt-8 inline-flex items-center gap-2.5 font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-gold no-underline">
            Or get everything with membership →
          </Link>
        </div>
      </header>

      {/* Catalog */}
      <section className="bg-ink-alt py-[100px]">
        <div className="mx-auto max-w-[1160px] px-8">
          {!loading && !error && categories.length > 0 && (
            <div className="mb-10 flex flex-wrap justify-center gap-2.5">
              {['All', ...categories].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className="cursor-pointer rounded-full px-5 py-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em]"
                  style={
                    activeCategory === cat
                      ? { background: '#C2A064', color: '#171C10' }
                      : { background: 'transparent', border: '1px solid rgba(240,238,229,0.16)', color: 'rgba(240,238,229,0.7)' }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {session && !loading && !error && continueWatchingResolved.length > 0 && (
            <div className="mb-16">
              <h2 className="mb-5 font-sans text-[15px] font-bold uppercase tracking-[0.14em] text-cream-solid">
                Continue watching
              </h2>
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {continueWatchingResolved.map(({ course, percent }) => (
                  <ProgramCard
                    key={course.id}
                    course={course}
                    access={getCourseAccess({ course, profile, isAdmin, purchasedCourseIds })}
                    episodeCount={episodeCounts[course.id]}
                    progressPercent={percent}
                    onEnroll={handleEnroll}
                    enrolling={enrollStatus.id === course.id && enrollStatus.pending}
                    enrollError={enrollStatus.id === course.id ? enrollStatus.error : ''}
                    promptForAccountId={promptForAccountId}
                  />
                ))}
              </div>
            </div>
          )}

          {loading && <p className="text-center font-serif text-cream/50">Loading programs…</p>}
          {!loading && error && <p className="text-center font-serif text-[#D8888A]">{error}</p>}
          {!loading && !error && filteredCourses.length === 0 && (
            <p className="text-center font-serif text-cream/50">No programs match this filter — check back soon.</p>
          )}
          {!loading && !error && filteredCourses.length > 0 && (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map(renderCard)}
            </div>
          )}
        </div>
      </section>

      {/* Prefer membership */}
      <section className="relative overflow-hidden bg-ink py-[100px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_0%,rgba(194,160,100,0.1),transparent_60%)]" />
        <div className="relative mx-auto max-w-[720px] px-8 text-center">
          <h2 className="mb-5 font-sans text-[30px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[38px]">
            Need more than one program?
          </h2>
          <p className="mx-auto mb-8 max-w-[520px] font-serif text-lg leading-[1.6] text-cream/70">
            Membership includes every course on this page — plus the full library, monthly
            teaching, and community — for less than the price of one program.
          </p>
          <Link to="/membership" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[34px] py-4 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink no-underline">
            See membership — $49/mo
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
