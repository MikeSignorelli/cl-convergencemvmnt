import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import logo from '../../assets/images/convergence-mvmnt.png'
import { fetchCourse } from '../../lib/courses'
import { fetchCourseVideoUrl, formatPrice, startCourseCheckout } from '../../lib/billing'
import { useAuth } from '../../lib/AuthContext'

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(240,238,229,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export default function CourseDetail() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const [course, setCourse] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [buying, setBuying] = useState(false)
  const [buyError, setBuyError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [courseData, url] = await Promise.all([fetchCourse(id), fetchCourseVideoUrl(id)])
        if (cancelled) return
        if (!courseData) {
          setError('Course not found.')
        } else {
          setCourse(courseData)
          setVideoUrl(url)
        }
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
  }, [id])

  const unlocked = isAdmin || !!videoUrl

  async function handleBuy() {
    setBuying(true)
    setBuyError('')
    try {
      await startCourseCheckout(id)
    } catch (err) {
      setBuyError(err.message || 'Could not start checkout. Please try again.')
      setBuying(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink font-sans text-cream antialiased">
      <header className="sticky top-0 z-40 flex h-[66px] items-center justify-between gap-6 border-b border-cream/[0.07] bg-ink/90 px-8 backdrop-blur-md">
        <Link
          to="/courses"
          className="flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/65 no-underline"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Course library
        </Link>
        <Link to="/dashboard">
          <img src={logo} alt="Convergence MVMNT" className="block h-10 w-auto" />
        </Link>
        <div />
      </header>

      <main className="mx-auto w-full max-w-[900px] px-10 py-14">
        {loading && <p className="font-serif text-cream/50">Loading…</p>}
        {!loading && error && <p className="font-serif text-[#D8888A]">{error}</p>}

        {!loading && !error && course && (
          <>
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="rounded-full border border-gold/35 bg-gold/[0.16] px-[13px] py-[5px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E9CF9C]">
                {unlocked ? 'Unlocked' : formatPrice(course.price_cents)}
              </span>
            </div>
            <h1 className="mb-3 text-[38px] font-bold uppercase leading-[1.02] text-white">{course.title}</h1>
            {course.description && (
              <p className="mb-8 max-w-[640px] font-serif text-[16.5px] leading-[1.6] text-cream/[78%]">
                {course.description}
              </p>
            )}

            {unlocked ? (
              <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)]">
                <div className="flex aspect-video items-center justify-center bg-black">
                  {videoUrl ? (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center gap-3 text-cream/80 no-underline"
                    >
                      <svg width="52" height="52" viewBox="0 0 24 24" fill="#C2A064">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em]">
                        Watch on external link ↗
                      </span>
                    </a>
                  ) : (
                    <span className="font-serif text-cream/50">This course doesn&rsquo;t have a video link set yet.</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-10 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream/[0.06]">
                  <LockIcon />
                </div>
                <div>
                  <h2 className="mb-1.5 font-sans text-lg font-bold uppercase text-white">
                    Purchase to unlock this course
                  </h2>
                  <p className="font-serif text-sm text-cream/60">
                    One-time purchase — yours to keep, separate from your membership.
                  </p>
                </div>
                {buyError && <p className="font-serif text-[13px] text-[#D8888A]">{buyError}</p>}
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={buying}
                  className="flex cursor-pointer items-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {buying ? 'Redirecting…' : `Buy course · ${formatPrice(course.price_cents)}`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
