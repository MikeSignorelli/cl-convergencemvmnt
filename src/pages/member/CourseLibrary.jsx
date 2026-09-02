import { Link, useNavigate } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { useAuth } from '../../lib/AuthContext'
import heroImage from '../../assets/app-images/course-library-1.jpg'
import img2 from '../../assets/app-images/course-library-2.jpg'
import img3 from '../../assets/app-images/course-library-3.jpg'
import img4 from '../../assets/app-images/course-library-4.jpg'
import img5 from '../../assets/app-images/course-library-5.jpg'
import img6 from '../../assets/app-images/course-library-6.jpg'

const FILTERS = ['All', 'Freedom & Healing', 'Leadership', 'Church Systems', 'Daily Resets']

const CONTINUE_LEARNING = [
  { image: img2, title: 'Inherit Your Freedom', meta: 'Week 2 of 12 · 34% complete', progress: 34 },
  { image: img3, title: 'Morning Mindset Reset', meta: 'Daily series · 12 of 90 days', progress: 13 },
]

const FREEDOM_HEALING = [
  { image: img4, title: 'Inherit Your Freedom: 90-Day Intensive', meta: '12 weeks · 36 episodes' },
  { image: img5, title: 'The Breakthrough Protocol', meta: '6 weeks · 18 episodes' },
  {
    gradient: 'linear-gradient(150deg, rgb(42, 51, 32), rgb(21, 26, 14))',
    title: 'Brain Recomposition',
    meta: '8 weeks · 24 episodes',
  },
  {
    gradient: 'linear-gradient(150deg, rgb(51, 41, 28), rgb(21, 26, 14))',
    title: 'Accelerated Freedom',
    meta: '4 weeks · 12 episodes',
    locked: 'Unlocks after Intensive',
  },
]

const LEADERSHIP_LEGACY = [
  { image: img6, title: "The Leader's Daily Reset", meta: 'Daily series · 5 min episodes' },
  {
    gradient: 'linear-gradient(150deg, rgb(35, 46, 51), rgb(18, 23, 14))',
    title: 'Purpose & Legacy Lab',
    meta: '6 weeks · 12 episodes',
  },
  {
    gradient: 'linear-gradient(150deg, rgb(30, 42, 51), rgb(18, 23, 14))',
    title: 'Boardroom Replays',
    meta: 'Monthly · members only',
    locked: 'Leader tier',
  },
]

const CHURCH_SYSTEMS = [
  {
    gradient: 'linear-gradient(150deg, rgb(51, 34, 42), rgb(21, 26, 14))',
    title: 'The Movement: Church Systems',
    meta: '10 modules · 24 templates',
  },
  {
    gradient: 'linear-gradient(150deg, rgb(46, 32, 48), rgb(21, 26, 14))',
    title: 'Marriage as a Pastor',
    meta: '6 weeks · with Julie Thompson',
  },
  {
    gradient: 'linear-gradient(150deg, rgb(38, 35, 46), rgb(21, 26, 14))',
    title: 'Sustainable Ministry',
    meta: '4 weeks · 10 episodes',
    locked: 'Pastor tier',
  },
]

function CourseCard({ image, gradient, title, meta, progress, locked }) {
  return (
    <Link to="/courses/detail" className="block w-[300px] shrink-0 text-inherit no-underline">
      <div
        className="relative mb-2.5 aspect-video overflow-hidden rounded-xl border border-cream/[0.09]"
        style={{ background: gradient ?? 'rgb(30, 36, 22)' }}
      >
        {image && (
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover brightness-[0.7]"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_40%,rgba(10,13,7,0.85))]" />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,13,7,0.45)]">
            <div className="flex items-center gap-[7px] rounded-full border border-cream/20 bg-[rgba(10,13,7,0.7)] px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/85">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {locked}
            </div>
          </div>
        )}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-base font-bold uppercase leading-[1.05] text-white">
          {title}
        </div>
        {progress != null && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-cream/[0.15]">
            <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <div className="text-xs font-semibold tracking-[0.06em] text-cream/55">{meta}</div>
    </Link>
  )
}

function CourseRow({ title, courses }) {
  return (
    <section>
      <h2 className="mb-3.5 text-[17px] font-bold uppercase tracking-[0.1em] text-white">{title}</h2>
      <div className="flex gap-[18px] overflow-x-auto">
        {courses.map((course) => (
          <CourseCard key={course.title} {...course} />
        ))}
      </div>
    </section>
  )
}

export default function CourseLibrary() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

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
          <section className="relative flex min-h-[380px] items-end overflow-hidden">
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_20%] brightness-[0.6]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,21,12,0.94)_22%,rgba(18,21,12,0.25)_70%),linear-gradient(transparent_40%,rgba(18,21,12,0.9))]" />
            <div className="relative max-w-[640px] px-10 pb-10 pt-12">
              <div className="mb-3.5 flex items-center gap-2.5">
                <span className="rounded-full bg-gold px-[13px] py-[5px] text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink">
                  Featured
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/65">
                  Freedom &amp; Healing · 12 weeks
                </span>
              </div>
              <h1 className="mb-3.5 text-[44px] font-bold uppercase leading-[0.98] tracking-[0.005em] text-white">
                Inherit Your Freedom
              </h1>
              <p className="mb-[26px] font-serif text-[16.5px] leading-[1.6] text-cream/78">
                The 90-Day Intensive. Map the patterns you inherited, confront the root beliefs beneath them, and
                rebuild what God intended — one week at a time.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  to="/player"
                  className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[30px] py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink no-underline"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Continue · Week 2
                </Link>
                <Link
                  to="/courses/detail"
                  className="inline-flex items-center rounded-full border border-cream/30 px-[26px] py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-cream no-underline"
                >
                  Course details
                </Link>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-[38px] px-10 pt-9">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter, i) => (
                <span
                  key={filter}
                  className={
                    i === 0
                      ? 'rounded-full bg-gold px-5 py-[9px] text-xs font-semibold uppercase tracking-[0.1em] text-ink'
                      : 'cursor-pointer rounded-full border border-cream/[0.14] px-5 py-[9px] text-xs font-semibold uppercase tracking-[0.1em] text-cream/65'
                  }
                >
                  {filter}
                </span>
              ))}
            </div>

            <CourseRow title="Continue learning" courses={CONTINUE_LEARNING} />
            <CourseRow title="Freedom & healing" courses={FREEDOM_HEALING} />
            <CourseRow title="Leadership & legacy" courses={LEADERSHIP_LEGACY} />
            <CourseRow title="Church systems · Pastors" courses={CHURCH_SYSTEMS} />
          </div>
        </main>
      </div>
    </div>
  )
}
