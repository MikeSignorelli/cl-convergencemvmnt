import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import { useAuth } from '../lib/AuthContext'
import { listStandaloneCourses } from '../lib/courses'
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

function ProgramCard({ course, onEnroll, enrollingId, enrollError }) {
  const enrolling = enrollingId === course.id

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
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h3 className="mb-2 font-sans text-xl font-bold uppercase tracking-[0.01em] text-cream-solid">{course.title}</h3>
        {course.duration_label && (
          <div className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-gold">{course.duration_label}</div>
        )}
        {course.description && (
          <p className="mb-6 flex-1 font-serif text-[15px] leading-[1.58] text-cream/65">{course.description}</p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="font-sans text-2xl font-bold text-cream-solid">{formatPrice(course.price_cents)}</div>
          <button
            type="button"
            onClick={() => onEnroll(course.id)}
            disabled={enrolling}
            className="cursor-pointer rounded-full border-none bg-gold px-6 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enrolling ? 'Redirecting…' : 'Enroll now'}
          </button>
        </div>
        {enrollError && enrollingId === course.id && (
          <p className="mt-3 font-serif text-[13px] text-[#D8888A]">{enrollError}</p>
        )}
      </div>
    </div>
  )
}

export default function Programs() {
  const { session } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrollingId, setEnrollingId] = useState(null)
  const [enrollError, setEnrollError] = useState('')

  useEffect(() => {
    let cancelled = false
    listStandaloneCourses()
      .then((data) => {
        if (!cancelled) setCourses(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleEnroll(courseId) {
    setEnrollError('')

    if (!session) {
      setEnrollingId(courseId)
      setEnrollError('Create a free account or log in first, then come back to enroll.')
      return
    }

    setEnrollingId(courseId)
    try {
      await startCoursePurchase(courseId)
    } catch (err) {
      setEnrollError(err.message || 'Could not start checkout. Please try again.')
      setEnrollingId(null)
    }
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
          {loading && <p className="text-center font-serif text-cream/50">Loading programs…</p>}
          {!loading && error && <p className="text-center font-serif text-[#D8888A]">{error}</p>}
          {!loading && !error && courses.length === 0 && (
            <p className="text-center font-serif text-cream/50">No standalone programs available right now — check back soon.</p>
          )}
          {!loading && !error && courses.length > 0 && (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <ProgramCard
                  key={course.id}
                  course={course}
                  onEnroll={handleEnroll}
                  enrollingId={enrollingId}
                  enrollError={enrollError}
                />
              ))}
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
