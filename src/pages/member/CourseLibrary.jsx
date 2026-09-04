import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { useAuth } from '../../lib/AuthContext'
import { listCourses } from '../../lib/courses'
import { getMyPurchasedCourseIds, formatPrice } from '../../lib/billing'
import heroImage from '../../assets/app-images/course-library-1.jpg'

function LockBadge() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,13,7,0.45)]">
      <div className="flex items-center gap-[7px] rounded-full border border-cream/20 bg-[rgba(10,13,7,0.7)] px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/85">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Locked
      </div>
    </div>
  )
}

function CourseCard({ course, unlocked }) {
  return (
    <Link to={`/courses/${course.id}`} className="block w-[300px] shrink-0 text-inherit no-underline">
      <div className="relative mb-2.5 aspect-video overflow-hidden rounded-xl border border-cream/[0.09] bg-[rgb(30,36,22)]">
        {course.thumbnail_path && (
          <img
            src={course.thumbnail_path}
            alt=""
            className="absolute inset-0 h-full w-full object-cover brightness-[0.7]"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_40%,rgba(10,13,7,0.85))]" />
        {!unlocked && <LockBadge />}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-base font-bold uppercase leading-[1.05] text-white">
          {course.title}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-[0.06em] text-cream/55">
          {course.description ? course.description.slice(0, 46) : 'Course'}
        </div>
        <div className="text-xs font-bold tracking-[0.06em] text-gold">
          {unlocked ? 'Owned' : formatPrice(course.price_cents)}
        </div>
      </div>
    </Link>
  )
}

export default function CourseLibrary() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [purchasedIds, setPurchasedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [courseList, purchased] = await Promise.all([listCourses(), getMyPurchasedCourseIds()])
        if (cancelled) return
        setCourses(courseList)
        setPurchasedIds(purchased)
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

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/courses" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar
          searchPlaceholder="Search courses…"
          actionLabel={isAdmin ? 'Upload Courses' : undefined}
          actionOnClick={() => navigate('/admin/courses')}
        />
        <main className="flex-1 pb-16">
          <section className="relative flex min-h-[240px] items-end overflow-hidden">
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_20%] brightness-[0.6]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,21,12,0.94)_22%,rgba(18,21,12,0.25)_70%),linear-gradient(transparent_40%,rgba(18,21,12,0.9))]" />
            <div className="relative max-w-[640px] px-10 pb-10 pt-12">
              <h1 className="mb-3.5 text-[38px] font-bold uppercase leading-[0.98] tracking-[0.005em] text-white">
                Course Library
              </h1>
              <p className="font-serif text-[16.5px] leading-[1.6] text-cream/78">
                Membership gets you access to the platform — each course is purchased individually.
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-[38px] px-10 pt-9">
            {loading && <p className="font-serif text-cream/50">Loading courses…</p>}
            {!loading && error && <p className="font-serif text-[#D8888A]">{error}</p>}
            {!loading && !error && courses.length === 0 && (
              <p className="font-serif text-cream/50">No courses published yet.</p>
            )}
            {!loading && !error && courses.length > 0 && (
              <section>
                <h2 className="mb-3.5 text-[17px] font-bold uppercase tracking-[0.1em] text-white">
                  All courses
                </h2>
                <div className="flex flex-wrap gap-[18px]">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      unlocked={isAdmin || purchasedIds.has(course.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
