import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import logo from '../../assets/images/convergence-mvmnt.png'
import PaymentWall from '../../components/PaymentWall'
import UpgradeLock from '../../components/UpgradeLock'
import VimeoPlayer from '../../components/VimeoPlayer'
import { fetchCourse } from '../../lib/courses'
import { listCourseLessons, fetchLessonVideoUrl, fetchLessonProgress, saveLessonProgress } from '../../lib/courseLessons'
import { listCourseResources, getResourceDownloadUrl } from '../../lib/resources'
import { useAuth } from '../../lib/AuthContext'

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E9CF9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function CourseDetail() {
  const { id } = useParams()
  const { profile, isAdmin, purchasedCourseIds, hasAnyPurchase } = useAuth()
  const [course, setCourse] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [lessonUrl, setLessonUrl] = useState(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [resumeSeconds, setResumeSeconds] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [courseData, eps, res] = await Promise.all([
          fetchCourse(id),
          listCourseLessons(id),
          listCourseResources(id).catch(() => []),
        ])
        if (cancelled) return
        if (!courseData) setError('Course not found.')
        else {
          setCourse(courseData)
          setEpisodes(eps)
          setResources(res)
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

  // À-la-carte buyers get into the member area; course access is the full rule
  // (admin / active member + matching tier / a completed purchase of THIS course).
  const hasPaidAccess = isAdmin || profile?.subscription_status === 'active' || hasAnyPurchase
  const hasCourseAccess =
    isAdmin ||
    (profile?.subscription_status === 'active' && course?.visible_tiers?.includes(profile?.tier)) ||
    (!!course && purchasedCourseIds.includes(course.id))

  // Default to the first released episode (admins get the first, released or not).
  useEffect(() => {
    if (selectedId || episodes.length === 0) return
    const first = episodes.find((e) => e.released) || (isAdmin ? episodes[0] : null)
    if (first) setSelectedId(first.id)
  }, [episodes, selectedId, isAdmin])

  // Fetch the selected episode's gated video URL on demand.
  useEffect(() => {
    if (!selectedId || !hasCourseAccess) {
      setLessonUrl(null)
      return
    }
    let cancelled = false
    setLessonLoading(true)
    setResumeSeconds(0)
    Promise.all([fetchLessonVideoUrl(selectedId), fetchLessonProgress(selectedId).catch(() => null)])
      .then(([url, prog]) => {
        if (cancelled) return
        setLessonUrl(url)
        setResumeSeconds(prog && !prog.completed ? prog.seconds || 0 : 0)
      })
      .catch(() => !cancelled && setLessonUrl(null))
      .finally(() => !cancelled && setLessonLoading(false))
    return () => {
      cancelled = true
    }
  }, [selectedId, hasCourseAccess])

  const selected = episodes.find((e) => e.id === selectedId) || null

  async function openResource(r) {
    if (r.external_url) {
      window.open(r.external_url, '_blank', 'noopener')
      return
    }
    try {
      const url = await getResourceDownloadUrl(r.file_path)
      window.open(url, '_blank', 'noopener')
    } catch {
      /* storage RLS denies if the caller lacks course access */
    }
  }

  if (!loading && !error && course && !hasPaidAccess) {
    return <PaymentWall status={profile?.subscription_status} />
  }

  const boxCls = 'flex aspect-video items-center justify-center rounded-cv-lg border border-cream/[0.09] bg-black text-center'

  return (
    <div className="min-h-screen bg-ink font-sans text-cream antialiased">
      <header className="sticky top-0 z-40 flex h-[66px] items-center justify-between gap-6 border-b border-cream/[0.07] bg-ink/90 px-8 backdrop-blur-md">
        <Link to="/courses" className="flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/65 no-underline">
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
                {hasCourseAccess ? 'Included' : 'Locked'}
              </span>
              {(course.category || course.duration_label) && (
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/55">
                  {[course.category, course.duration_label].filter(Boolean).join(' · ')}
                </span>
              )}
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/40">
                {episodes.length} episode{episodes.length === 1 ? '' : 's'}
              </span>
            </div>
            <h1 className="mb-3 text-[38px] font-bold uppercase leading-[1.02] text-white">{course.title}</h1>
            {course.description && (
              <p className="mb-8 max-w-[640px] font-serif text-[16.5px] leading-[1.6] text-cream/[78%]">{course.description}</p>
            )}

            {hasCourseAccess ? (
              <>
                {!selected ? (
                  <div className={boxCls}>
                    <span className="font-serif text-cream/50">No episodes published yet.</span>
                  </div>
                ) : selected.released || isAdmin ? (
                  lessonLoading ? (
                    <div className={boxCls}><span className="font-serif text-cream/50">Loading video…</span></div>
                  ) : lessonUrl ? (
                    <VimeoPlayer
                      key={selected.id}
                      video={lessonUrl}
                      startAt={resumeSeconds}
                      onProgress={(d) =>
                        saveLessonProgress({
                          lessonId: selected.id,
                          courseId: course.id,
                          seconds: d.seconds,
                          duration: d.duration,
                          percent: d.percent,
                        })
                      }
                      onComplete={(d) =>
                        saveLessonProgress({
                          lessonId: selected.id,
                          courseId: course.id,
                          seconds: d?.duration ?? d?.seconds,
                          duration: d?.duration,
                          percent: 1,
                          completed: true,
                        })
                      }
                    />
                  ) : (
                    <div className={boxCls}><span className="font-serif text-cream/50">This episode doesn&rsquo;t have a video yet.</span></div>
                  )
                ) : (
                  <div className={`${boxCls} flex-col gap-2`}>
                    <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-[#E9CF9C]">Unlocks {fmtDate(selected.release_at)}</span>
                    <span className="font-serif text-cream/50">This episode isn&rsquo;t available yet.</span>
                  </div>
                )}

                {episodes.length > 0 && (
                  <div className="mt-6 flex flex-col gap-2">
                    <h2 className="mb-1 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-white/80">Episodes</h2>
                    {episodes.map((ep, i) => {
                      const playable = ep.released || isAdmin
                      const isSel = ep.id === selectedId
                      return (
                        <button
                          key={ep.id}
                          type="button"
                          disabled={!playable}
                          onClick={() => playable && setSelectedId(ep.id)}
                          className={`flex items-center gap-3.5 rounded-xl border px-4 py-3 text-left ${
                            isSel ? 'border-gold/50 bg-gold/[0.1]' : 'border-cream/[0.09] bg-[rgb(22,27,15)]'
                          } ${playable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                        >
                          <span className="w-5 shrink-0 font-serif text-sm text-cream/45">{i + 1}</span>
                          <div className="relative h-11 w-20 shrink-0 overflow-hidden rounded-md bg-[rgb(30,36,22)]">
                            {ep.thumbnail_url && (
                              <img src={ep.thumbnail_url} alt="" className={`h-full w-full object-cover ${playable ? '' : 'blur-[2px] brightness-[0.6]'}`} />
                            )}
                            {!playable && <div className="absolute inset-0 flex items-center justify-center"><LockIcon /></div>}
                          </div>
                          <div className="min-w-0 flex-1">
                            {ep.week_number && (
                              <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-gold/80">Week {ep.week_number}</div>
                            )}
                            <div className="truncate font-sans text-[14px] font-semibold text-white">{ep.title}</div>
                            <div className="font-serif text-[12.5px] text-cream/50">
                              {ep.released ? ep.duration_label || 'Available now' : `Unlocks ${fmtDate(ep.release_at)}`}
                            </div>
                          </div>
                          {isSel && playable && (
                            <span className="shrink-0 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-gold">Now playing</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {resources.length > 0 && (
                  <div className="mt-8">
                    <h2 className="mb-3 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-white/80">
                      Course materials &amp; summary
                    </h2>
                    <div className="flex flex-col gap-2">
                      {resources.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => openResource(r)}
                          className="flex items-center justify-between gap-3 rounded-xl border border-cream/[0.09] bg-[rgb(22,27,15)] px-4 py-3 text-left"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <path d="M14 2v6h6" />
                            </svg>
                            <div className="min-w-0">
                              <div className="truncate font-sans text-[14px] font-semibold text-white">{r.title}</div>
                              {r.description && <div className="truncate font-serif text-[12.5px] text-cream/50">{r.description}</div>}
                            </div>
                          </div>
                          <span className="shrink-0 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-gold">
                            {r.external_url ? 'Open ↗' : 'Download'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <UpgradeLock
                title="Unlock this course"
                message={`${episodes.length} episode${episodes.length === 1 ? '' : 's'} inside — join the Convergence membership to stream the whole thing.`}
                minHeight={360}
              >
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
