import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import PaymentWall from '../../components/PaymentWall'
import { useAuth } from '../../lib/AuthContext'
import { listCourses } from '../../lib/courses'
import heroImage from '../../assets/app-images/course-library-1.jpg'

function capitalize(word) {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : word
}

function LockBadge({ label }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,13,7,0.45)]">
      <div className="flex items-center gap-[7px] rounded-full border border-cream/20 bg-[rgba(10,13,7,0.7)] px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/85">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {label}
      </div>
    </div>
  )
}

function CourseCard({ course, unlocked }) {
  const lockLabel = `${capitalize(course.visible_tiers?.[0])} tier`
  return (
    <Link to={`/courses/${course.id}`} className="block w-[300px] shrink-0 text-inherit no-underline">
      <div className="relative mb-2.5 aspect-video overflow-hidden rounded-xl border border-cream/[0.09] bg-[rgb(30,36,22)]">
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${
              unlocked ? 'brightness-[0.7]' : 'scale-105 brightness-[0.5] blur-[3px]'
            }`}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_40%,rgba(10,13,7,0.85))]" />
        {!unlocked && <LockBadge label={lockLabel} />}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-base font-bold uppercase leading-[1.05] text-white">
          {course.title}
        </div>
      </div>
      {course.duration_label && (
        <div className="text-xs font-semibold tracking-[0.06em] text-cream/55">{course.duration_label}</div>
      )}
    </Link>
  )
}

export default function CourseLibrary() {
  const { profile, isAdmin, purchasedCourseIds, hasAnyPurchase } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    let cancelled = false
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
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Every course is included in the single membership — access is gated
  // on an active subscription (see PaymentWall) plus the member's own tier
  // matching a course's visible_tiers (see get_course_video_url in
  // migration 0013), not on purchasing anything individually.
  // À-la-carte buyers get in too (they see their course; the rest are locked).
  const hasPaidAccess = isAdmin || profile?.subscription_status === 'active' || hasAnyPurchase

  const isUnlocked = (course) =>
    isAdmin ||
    (profile?.subscription_status === 'active' && course.visible_tiers?.includes(profile?.tier)) ||
    purchasedCourseIds.includes(course.id)

  const categories = useMemo(() => {
    const seen = []
    for (const c of courses) {
      const cat = c.category || 'More courses'
      if (!seen.includes(cat)) seen.push(cat)
    }
    return seen
  }, [courses])

  const groups = useMemo(() => {
    const cats = activeCategory === 'All' ? categories : [activeCategory]
    return cats.map((cat) => ({
      category: cat,
      courses: courses.filter((c) => (c.category || 'More courses') === cat),
    }))
  }, [courses, categories, activeCategory])

  const featured = useMemo(
    () => courses.find((c) => c.featured) || courses[0] || null,
    [courses]
  )

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/courses" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar
          searchPlaceholder="Search courses…"
          actionLabel={isAdmin ? 'Upload Courses' : undefined}
          actionOnClick={() => navigate('/admin/courses')}
        />

        {!hasPaidAccess ? (
          <PaymentWall status={profile?.subscription_status} />
        ) : (
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

          <div className="flex flex-col gap-[38px] px-10 pt-9">
            {!loading && !error && courses.length === 0 && (
              <p className="font-serif text-cream/50">No courses published yet.</p>
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
                        {group.courses.map((course) => (
                          <CourseCard key={course.id} course={course} unlocked={isUnlocked(course)} />
                        ))}
                      </div>
                    </section>
                  )
              )}
          </div>
        </main>
        )}
      </div>
    </div>
  )
}
