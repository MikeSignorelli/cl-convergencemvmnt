import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import CourseDetailsPanel from '../../components/admin/CourseDetailsPanel'
import EpisodesPanel from '../../components/admin/EpisodesPanel'
import CourseResourcesPanel from '../../components/admin/CourseResourcesPanel'
import { adminListCourses } from '../../lib/courses'

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'episodes', label: 'Episodes' },
  { key: 'resources', label: 'Resources' },
]

export default function ManageCourse() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState('details')

  async function loadCourse() {
    try {
      const list = await adminListCourses()
      const found = list.find((c) => c.id === courseId)
      if (found) setCourse(found)
      else setNotFound(true)
    } catch {
      setNotFound(true)
    }
    setLoading(false)
  }
  useEffect(() => {
    loadCourse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/courses" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar searchPlaceholder="Search courses…" />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <Link to="/admin/courses" className="mb-4 inline-block font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/50 no-underline">
            ← All courses
          </Link>

          {loading && <p className="font-serif text-cream/50">Loading…</p>}
          {notFound && !loading && <p className="font-serif text-[#D8888A]">Course not found. <Link to="/admin/courses" className="text-gold">Back to courses</Link></p>}

          {course && (
            <>
              <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">{course.title}</h1>
              <p className="mb-6 font-serif text-[15px] text-cream/60">
                {course.visible_tiers?.length ? `Visible to ${course.visible_tiers.join(', ')}` : 'Not assigned to any tier yet'}
                {course.price_cents > 0 ? ` · also sold standalone` : ''}
              </p>

              <div className="mb-7 flex gap-1 border-b border-cream/[0.1]">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className="cursor-pointer border-none bg-transparent px-5 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.1em]"
                    style={
                      tab === t.key
                        ? { color: '#E9CF9C', borderBottom: '2px solid #C2A064', marginBottom: '-1px' }
                        : { color: 'rgba(240,238,229,0.5)' }
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'details' && <CourseDetailsPanel course={course} onSaved={loadCourse} />}
              {tab === 'episodes' && <EpisodesPanel courseId={course.id} />}
              {tab === 'resources' && <CourseResourcesPanel courseId={course.id} />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
