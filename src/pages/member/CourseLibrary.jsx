import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import CourseCard from '../../components/CourseCard'
import { useAuth } from '../../lib/AuthContext'
import { listCourses } from '../../lib/courses'
import { fetchEpisodeCounts } from '../../lib/courseLessons'
import { fetchMyProgress, fetchContinueWatchingCourses } from '../../lib/progress'
import { getCourseAccess } from '../../lib/courseAccess'
import { startCoursePurchase } from '../../lib/billing'
import heroImage from '../../assets/app-images/course-library-1.jpg'

// Horizontal "Continue watching" row — only the courses this member has
// actually started and not finished, most-recently-watched first. Skipped
// entirely for admin (no progress is ever tracked for that role) and for
// anyone with nothing in progress yet. progress-continue-watching only
// returns a flat summary (course id/title/thumbnail path), not the full
// course row, so this re-resolves each item against the already-loaded
// `courses` list to get visible_tiers/price_cents/etc for CourseCard, and
// re-checks access for real (getCourseAccess) rather than assuming
// unlocked=true — a lapsed membership should still show the same lock/price
// state here as everywhere else.
function ContinueWatchingRow({ items, courses, episodeCounts, profile, isAdmin, purchasedCourseIds }) {
  const resolved = items
    .map((item) => {
      const course = courses.find((c) => c.id === item.courseId)
      return course ? { course, percent: item.percent } : null
    })
    .filter(Boolean)

  if (resolved.length === 0) return null
  return (
    <div className="px-10 pt-9">
      <h2 className="mb-3.5 text-[17px] font-bold uppercase tracking-[0.1em] text-white">Continue watching</h2>
      <div className="flex flex-wrap gap-[18px]">
        {resolved.map(({ course, percent }) => (
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
  )
}

export default function CourseLibrary() {
  const { profile, isAdmin, purchasedCourseIds } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [episodeCounts, setEpisodeCounts] = useState({})
  const [progressByCourseId, setProgressByCourseId] = useState({})
  const [continueWatching, setContinueWatching] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [query, setQuery] = useState('')
  // One object rather than two separate states: clearing enrollingId on
  // error also blanked the error message that was keyed off it, so it never
  // actually rendered.
  const [enrollStatus, setEnrollStatus] = useState({ id: null, pending: false, error: '' })

  useEffect(() => {
    let cancelled = false

    // Split out from the course list load so it can also be called again
    // on its own (see the visibility effect below) without re-fetching
    // courses/episode counts every time — this is the part that's actually
    // live and needs to stay fresh: course_progress is recomputed by the
    // heartbeat/complete/start-over Edge Functions on every real watch
    // event, so re-running this after the member comes back to this tab
    // (having watched more, possibly on another device) reflects that
    // immediately instead of showing whatever was true when the page first
    // mounted. Admin never has progress rows, so both calls just no-op for
    // that role.
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
        const items = await fetchContinueWatchingCourses(6)
        if (!cancelled) setContinueWatching(items)
      } catch {
        /* continue-watching row just stays empty */
      }
    }

    async function load() {
      try {
        const courseList = await listCourses()
        if (cancelled) return
        setCourses(courseList)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
      // Episode counts and progress are separate, best-effort fetches —
      // neither should block the course grid itself from rendering (graceful
      // failure: the API being down just means no bars/counts, not a broken
      // page), and a member with nothing started yet legitimately has no
      // progress rows at all.
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

  const categories = useMemo(() => {
    const seen = []
    for (const c of courses) {
      const cat = c.category || 'More courses'
      if (!seen.includes(cat)) seen.push(cat)
    }
    return seen
  }, [courses])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (c) => !q || `${c.title || ''} ${c.category || ''} ${c.description || ''}`.toLowerCase().includes(q)
    const cats = activeCategory === 'All' ? categories : [activeCategory]
    return cats.map((cat) => ({
      category: cat,
      courses: courses.filter((c) => (c.category || 'More courses') === cat && match(c)),
    }))
  }, [courses, categories, activeCategory, query])

  const totalVisible = useMemo(() => groups.reduce((n, g) => n + g.courses.length, 0), [groups])

  const featured = useMemo(
    () => courses.find((c) => c.featured) || courses[0] || null,
    [courses]
  )

  function handleEnroll(courseId) {
    setEnrollStatus({ id: courseId, pending: true, error: '' })
    startCoursePurchase(courseId).catch((err) => {
      setEnrollStatus({ id: courseId, pending: false, error: err.message || 'Could not start checkout. Please try again.' })
    })
  }

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/courses" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar
          searchPlaceholder="Search courses…"
          search={query}
          onSearch={setQuery}
          actionLabel={isAdmin ? 'Upload Courses' : undefined}
          actionOnClick={() => navigate('/admin/courses')}
        />

        <main className="flex-1 pb-16">
          {loading && <p className="px-10 pt-9 font-serif text-cream/50">Loading courses…</p>}
          {!loading && error && <p className="px-10 pt-9 font-serif text-[#D8888A]">{error}</p>}

          {!loading && !error && featured && (
            <section className="relative flex min-h-[240px] items-end overflow-hidden">
              <img
                src={heroImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-[center_20%] brightness-[0.6]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,21,12,0.94)_22%,rgba(18,21,12,0.25)_70%),linear-gradient(transparent_40%,rgba(18,21,12,0.9))]" />
              <div className="relative max-w-[640px] px-10 pb-10 pt-12">
                <div className="mb-2.5 flex items-center gap-2.5">
                  {featured.featured && (
                    <span className="rounded-full border border-gold/35 bg-gold/[0.16] px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E9CF9C]">
                      Featured
                    </span>
                  )}
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/55">
                    {[featured.category, featured.duration_label].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <h1 className="mb-3.5 text-[38px] font-bold uppercase leading-[0.98] tracking-[0.005em] text-white">
                  {featured.title}
                </h1>
                {featured.description && (
                  <p className="mb-6 font-serif text-[16.5px] leading-[1.6] text-cream/[78%]">
                    {featured.description}
                  </p>
                )}
                <Link
                  to={`/courses/${featured.id}`}
                  className="inline-flex items-center gap-2.5 rounded-full border border-cream/25 px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream no-underline"
                >
                  Course details
                </Link>
              </div>
            </section>
          )}

          {!loading && !error && (
            <div className="flex flex-wrap gap-2.5 px-10 pt-7">
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

          {!loading && !error && !isAdmin && (
            <ContinueWatchingRow
              items={continueWatching}
              courses={courses}
              episodeCounts={episodeCounts}
              profile={profile}
              isAdmin={isAdmin}
              purchasedCourseIds={purchasedCourseIds}
            />
          )}

          <div className="flex flex-col gap-[38px] px-10 pt-9">
            {!loading && !error && courses.length === 0 && (
              <p className="font-serif text-cream/50">No courses published yet.</p>
            )}
            {!loading && !error && courses.length > 0 && totalVisible === 0 && (
              <p className="font-serif text-cream/50">No courses match “{query}”.</p>
            )}
            {!loading &&
              !error &&
              groups.map(
                (group) =>
                  group.courses.length > 0 && (
                    <section key={group.category}>
                      <h2 className="mb-3.5 text-[17px] font-bold uppercase tracking-[0.1em] text-white">
                        {group.category}
                      </h2>
                      <div className="flex flex-wrap gap-[18px]">
                        {group.courses.map((course) => {
                          const access = getCourseAccess({ course, profile, isAdmin, purchasedCourseIds })
                          return (
                            <CourseCard
                              key={course.id}
                              course={course}
                              access={access}
                              episodeCount={episodeCounts[course.id]}
                              progressPercent={progressByCourseId[course.id] || 0}
                              onEnroll={handleEnroll}
                              enrolling={enrollStatus.id === course.id && enrollStatus.pending}
                              enrollError={enrollStatus.id === course.id ? enrollStatus.error : ''}
                            />
                          )
                        })}
                      </div>
                    </section>
                  )
              )}
          </div>
        </main>
      </div>
    </div>
  )
}
