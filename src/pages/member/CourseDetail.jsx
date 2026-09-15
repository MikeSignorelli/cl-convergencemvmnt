import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import logo from '../../assets/images/convergence-mvmnt.png'
import PaymentWall from '../../components/PaymentWall'
import UpgradeLock from '../../components/UpgradeLock'
import VimeoPlayer from '../../components/VimeoPlayer'
import { fetchCourse } from '../../lib/courses'
import { fetchCourseVideoUrl } from '../../lib/billing'
import { useAuth } from '../../lib/AuthContext'

export default function CourseDetail() {
  const { id } = useParams()
  const { profile, isAdmin } = useAuth()
  const [course, setCourse] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  // Every course is included in the single membership — the video itself
  // only ever comes back from get_course_video_url() (see billing.js) once
  // the member's tier + active subscription are confirmed server-side
  // (migration 0013), so a truthy videoUrl is the real unlock signal here.
  const hasPaidAccess = isAdmin || profile?.subscription_status === 'active'
  const unlocked = isAdmin || !!videoUrl

  if (!loading && !error && course && !hasPaidAccess) {
    return <PaymentWall status={profile?.subscription_status} />
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
            <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-gold/35 bg-gold/[0.16] px-[13px] py-[5px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E9CF9C]">
                {unlocked ? 'Included' : 'Locked'}
              </span>
              {(course.category || course.duration_label) && (
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/55">
                  {[course.category, course.duration_label].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
            <h1 className="mb-3 text-[38px] font-bold uppercase leading-[1.02] text-white">{course.title}</h1>
            {course.description && (
              <p className="mb-8 max-w-[640px] font-serif text-[16.5px] leading-[1.6] text-cream/[78%]">
                {course.description}
              </p>
            )}

            {unlocked ? (
              videoUrl ? (
                <VimeoPlayer video={videoUrl} />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-cv-lg border border-cream/[0.09] bg-black">
                  <span className="font-serif text-cream/50">This course doesn&rsquo;t have a video link set yet.</span>
                </div>
              )
            ) : (
              <UpgradeLock
                title="Unlock this course"
                message="This course is part of the Convergence full membership — join to stream it and unlock the entire library."
                minHeight={360}
              >
                {/* Faux player, blurred behind the lock to hint at the content. */}
                <div className="flex aspect-video w-full items-center justify-center bg-black">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="#C2A064">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </UpgradeLock>
            )}
          </>
        )}
      </main>
    </div>
  )
}
