import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import logo from '../../assets/images/convergence-mvmnt.png'
import mikePortrait from '../../assets/images/drop-a-portrait-of-mike.webp'
import PaymentWall from '../../components/PaymentWall'
import UpgradeLock from '../../components/UpgradeLock'
import VimeoPlayer from '../../components/VimeoPlayer'
import { fetchCourse } from '../../lib/courses'
import { listCourseLessons, fetchLessonVideoUrl, fetchLessonProgress, fetchCourseProgress, saveLessonProgress } from '../../lib/courseLessons'
import { listCourseResources, getResourceDownloadUrl } from '../../lib/resources'
import { useAuth } from '../../lib/AuthContext'

// The platform is Mike's, so the instructor card is the same on every course.
// The "Included" perks are membership-level too — both are fixed here for now
// (easy to make per-course later with a couple of course fields).
const INSTRUCTOR = {
  name: 'Mike Signorelli',
  bio: 'Pastor, author of Unoffendable Heart, and founder of Convergence MVMNT. Mike walks every week of the intensive with you.',
}
const INCLUDED = ['Weekly workbook (PDF)', 'Private intensive community', 'Monthly hot seat coaching', 'Completion certificate']

function initialsOf(name) {
  if (!name) return '—'
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
}
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E9CF9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function PlayIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#F0EEE5"><path d="M8 5v14l11-7z" /></svg>
  )
}
function TickList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9BC08A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

// Client-side mirror of the server's sequential-access rule (get_lesson_video_url,
// migration 0027) — a UX nicety only, not the real gate: the RPC still returns
// null (and the video just won't load) if this ever disagrees with it.
// `episodes` is already ordered by `position` (listCourseLessons), the same
// ordering the server's own "immediately previous lesson" check is built on,
// so index - 1 is that same predecessor for every course whose episodes were
// laid out through the admin panel.
function isSequentiallyLocked(ep, index, episodes, course, progress, isAdmin) {
  if (isAdmin || !ep || course?.access_mode !== 'sequential' || ep.is_open_access || index <= 0) {
    return false
  }
  const prev = episodes[index - 1]
  return !!prev && !progress[prev.id]?.completed
}

export default function CourseDetail() {
  const { id } = useParams()
  const { profile, isAdmin, purchasedCourseIds, hasAnyPurchase } = useAuth()
  const [course, setCourse] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [resources, setResources] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playingId, setPlayingId] = useState(null)
  const [lessonUrl, setLessonUrl] = useState(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [resumeSeconds, setResumeSeconds] = useState(0)
  const playerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [courseData, eps, res, prog] = await Promise.all([
          fetchCourse(id),
          listCourseLessons(id),
          listCourseResources(id).catch(() => []),
          fetchCourseProgress(id).catch(() => ({})),
        ])
        if (cancelled) return
        if (!courseData) setError('Course not found.')
        else {
          setCourse(courseData)
          setEpisodes(eps)
          setResources(res)
          setProgress(prog || {})
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // À-la-carte buyers get into the member area; course access is the full rule
  // (admin / active member + matching tier / a completed purchase of THIS course).
  const hasPaidAccess = isAdmin || profile?.subscription_status === 'active' || hasAnyPurchase
  const hasCourseAccess =
    isAdmin ||
    (profile?.subscription_status === 'active' && course?.visible_tiers?.includes(profile?.tier)) ||
    (!!course && purchasedCourseIds.includes(course.id))

  // Task #5 (ManageCourse "Preview as user"): status is new on courses (0021)
  // and fetchCourse() didn't select it at all before this — a draft/archived
  // course was reachable by anyone who had (or guessed) its URL. Mirrors the
  // admin-bypass pattern used everywhere else on this page (isAdmin
  // short-circuits release-date/sequential gates too): a normal member only
  // ever sees a published course, while an admin can open any status,
  // including from the ManageCourse "Preview as user" link.
  const courseVisible = !course || !course.status || course.status === 'published' || isAdmin

  // Episodes decorated with week/episode numbering, watch state, and the
  // sequential-access lock (course.access_mode === 'sequential').
  const decorated = useMemo(() => {
    const perWeek = {}
    return episodes.map((ep, index) => {
      const p = progress[ep.id]
      let epInWeek = null
      if (ep.week_number != null) {
        perWeek[ep.week_number] = (perWeek[ep.week_number] || 0) + 1
        epInWeek = perWeek[ep.week_number]
      }
      const sequentiallyLocked = isSequentiallyLocked(ep, index, episodes, course, progress, isAdmin)
      return {
        ...ep,
        epInWeek,
        done: !!p?.completed,
        pct: p?.completed ? 1 : p?.percent || 0,
        playable: (ep.released || isAdmin) && !sequentiallyLocked,
        sequentiallyLocked,
      }
    })
  }, [episodes, progress, course, isAdmin])

  const upNext = useMemo(() => decorated.find((e) => e.playable && !e.done) || null, [decorated])
  const completedCount = useMemo(() => decorated.filter((e) => e.done).length, [decorated])
  const progressPct = useMemo(() => {
    if (episodes.length === 0) return 0
    const sum = decorated.reduce((s, e) => s + e.pct, 0)
    return Math.round((sum / episodes.length) * 100)
  }, [decorated, episodes.length])

  const playing = decorated.find((e) => e.id === playingId) || null

  // Fetch the gated video URL only once the member chooses to watch something.
  useEffect(() => {
    if (!playingId || !hasCourseAccess) { setLessonUrl(null); return }
    let cancelled = false
    setLessonLoading(true)
    setResumeSeconds(0)
    Promise.all([fetchLessonVideoUrl(playingId), fetchLessonProgress(playingId).catch(() => null)])
      .then(([url, prog]) => {
        if (cancelled) return
        setLessonUrl(url)
        setResumeSeconds(prog && !prog.completed ? prog.seconds || 0 : 0)
      })
      .catch(() => !cancelled && setLessonUrl(null))
      .finally(() => !cancelled && setLessonLoading(false))
    return () => { cancelled = true }
  }, [playingId, hasCourseAccess])

  useEffect(() => {
    if (playingId && playerRef.current) playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [playingId])

  function play(ep) {
    if (ep?.playable) setPlayingId(ep.id)
  }
  function handleProgress(d) {
    if (!playing) return
    saveLessonProgress({ lessonId: playing.id, courseId: course.id, seconds: d.seconds, duration: d.duration, percent: d.percent })
    setProgress((prev) => ({ ...prev, [playing.id]: { ...(prev[playing.id] || {}), percent: d.percent, seconds: Math.round(d.seconds || 0) } }))
  }
  function handleComplete(d) {
    if (!playing) return
    saveLessonProgress({ lessonId: playing.id, courseId: course.id, seconds: d?.duration ?? d?.seconds, duration: d?.duration, percent: 1, completed: true })
    setProgress((prev) => ({ ...prev, [playing.id]: { ...(prev[playing.id] || {}), percent: 1, completed: true } }))
  }
  async function openResource(r) {
    if (r.external_url) { window.open(r.external_url, '_blank', 'noopener'); return }
    try {
      const url = await getResourceDownloadUrl(r.file_path)
      window.open(url, '_blank', 'noopener')
    } catch { /* storage RLS denies if the caller lacks course access */ }
  }

  if (!loading && !error && course && !courseVisible) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink font-sans text-cream">
        <p className="font-serif text-cream/60">
          Course not found. <Link to="/courses" className="text-gold">Back to courses</Link>
        </p>
      </div>
    )
  }

  if (!loading && !error && course && !hasPaidAccess) {
    return <PaymentWall status={profile?.subscription_status} />
  }

  const heroBg = course?.thumbnail_url
  const metaBits = [course?.duration_label || `${episodes.length} episode${episodes.length === 1 ? '' : 's'}`, 'Certificate']

  return (
    <div className="min-h-screen bg-ink font-sans text-cream antialiased">
      <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between gap-6 border-b border-cream/[0.07] bg-ink/90 px-6 backdrop-blur-md">
        <Link to="/courses" className="flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/65 no-underline">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Course library
        </Link>
        <Link to="/dashboard"><img src={logo} alt="Convergence MVMNT" className="block h-8 w-auto" /></Link>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.12] px-3 py-1.5 sm:flex">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E89147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
            <span className="font-sans text-[12px] font-bold text-[#E9CF9C]">12-day streak</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/[0.14] font-sans text-[12px] font-bold text-gold">
            {initialsOf(profile?.display_name || profile?.username)}
          </div>
        </div>
      </header>

      {loading && <p className="px-10 py-14 font-serif text-cream/50">Loading…</p>}
      {!loading && error && <p className="px-10 py-14 font-serif text-[#D8888A]">{error}</p>}

      {!loading && !error && course && (
        <>
          {/* Hero */}
          <section className="relative flex min-h-[300px] items-end overflow-hidden border-b border-cream/[0.07]">
            {heroBg ? (
              <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_25%] brightness-[0.4]" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(194,160,100,0.22),transparent_60%)]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,21,12,0.92)_30%,rgba(18,21,12,0.35)_75%),linear-gradient(transparent_45%,rgba(18,21,12,0.9))]" />
            <div className="relative mx-auto w-full max-w-[1400px] px-6 pb-9 pt-14 lg:px-10">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {course.category && (
                  <span className="rounded-full border border-gold/35 bg-gold/[0.16] px-[13px] py-[5px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E9CF9C]">
                    {course.category}
                  </span>
                )}
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/60">
                  {metaBits.join(' · ')}
                </span>
              </div>
              <h1 className="max-w-[760px] text-[clamp(28px,4vw,44px)] font-bold uppercase leading-[1.02] text-white">{course.title}</h1>
              {course.description && (
                <p className="mt-3 max-w-[560px] font-serif text-[15.5px] leading-[1.6] text-cream/[80%]">{course.description}</p>
              )}
            </div>
          </section>

          {!hasCourseAccess ? (
            <div className="mx-auto w-full max-w-[900px] px-6 py-12 lg:px-10">
              <UpgradeLock
                title="Unlock this course"
                message={`${episodes.length} episode${episodes.length === 1 ? '' : 's'} inside — join the Convergence membership to stream the whole thing.`}
                minHeight={360}
              >
                <div className="flex aspect-video w-full items-center justify-center bg-black">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="#C2A064"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </UpgradeLock>
            </div>
          ) : (
            <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-9 px-6 py-10 lg:grid-cols-[1fr_360px] lg:px-10">
              {/* Left — player (on demand) + episode list */}
              <div className="min-w-0">
                {playing && (
                  <div ref={playerRef} className="mb-7">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-gold">Now playing · {playing.title}</span>
                      <button type="button" onClick={() => setPlayingId(null)} className="cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/50 hover:text-cream/80">Close ✕</button>
                    </div>
                    {lessonLoading ? (
                      <div className="flex aspect-video items-center justify-center rounded-cv-lg border border-cream/[0.09] bg-black"><span className="font-serif text-cream/50">Loading video…</span></div>
                    ) : lessonUrl ? (
                      <VimeoPlayer key={playing.id} video={lessonUrl} startAt={resumeSeconds} onProgress={handleProgress} onComplete={handleComplete} />
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-cv-lg border border-cream/[0.09] bg-black"><span className="font-serif text-cream/50">This episode doesn&rsquo;t have a video yet.</span></div>
                    )}
                  </div>
                )}

                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="font-sans text-[13px] font-bold uppercase tracking-[0.14em] text-white/85">Episodes</h2>
                  <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-cream/45">{completedCount} of {episodes.length} complete</span>
                </div>

                {episodes.length === 0 && <p className="font-serif text-cream/50">No episodes published yet.</p>}

                <div className="flex flex-col gap-2.5">
                  {decorated.map((ep) => {
                    const isPlaying = ep.id === playingId
                    const isUpNext = upNext && ep.id === upNext.id
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        disabled={!ep.playable}
                        onClick={() => play(ep)}
                        className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition ${
                          isPlaying
                            ? 'border-gold/60 bg-gold/[0.12]'
                            : isUpNext
                            ? 'border-gold/40 bg-gold/[0.06]'
                            : 'border-cream/[0.08] bg-[rgb(22,27,15)]'
                        } ${ep.playable ? 'cursor-pointer hover:border-cream/25' : 'cursor-not-allowed opacity-70'}`}
                      >
                        <div className="relative h-[52px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-[rgb(30,36,22)]">
                          {ep.thumbnail_url && (
                            <img src={ep.thumbnail_url} alt="" className={`h-full w-full object-cover ${ep.playable ? 'brightness-[0.85]' : 'blur-[2px] brightness-[0.5]'}`} />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(10,13,7,0.72)]">
                              {ep.done ? <CheckIcon /> : ep.playable ? <PlayIcon /> : <LockIcon />}
                            </div>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-gold/80">
                            {ep.week_number != null ? `Week ${ep.week_number}${ep.epInWeek ? ` · Episode ${ep.epInWeek}` : ''}` : 'Episode'}
                          </div>
                          <div className="truncate font-sans text-[15px] font-semibold text-white">{ep.title}</div>
                          <div className="truncate font-serif text-[12.5px] text-cream/50">
                            {ep.playable
                              ? ep.description || ''
                              : ep.sequentiallyLocked
                              ? 'Finish the previous episode first'
                              : `Unlocks ${fmtDate(ep.release_at)}`}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          {ep.duration_label && ep.playable && <span className="font-serif text-[12.5px] text-cream/45">{ep.duration_label}</span>}
                          {ep.done ? (
                            <span className="rounded-full border border-gold/40 px-2.5 py-1 font-sans text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#E9CF9C]">Done</span>
                          ) : isUpNext ? (
                            <span className="rounded-full bg-gold px-2.5 py-1 font-sans text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink">Up next</span>
                          ) : !ep.playable ? (
                            <LockIcon />
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {resources.length > 0 && (
                  <div className="mt-9">
                    <h2 className="mb-3 font-sans text-[13px] font-bold uppercase tracking-[0.14em] text-white/85">Course materials &amp; summary</h2>
                    <div className="flex flex-col gap-2">
                      {resources.map((r) => (
                        <button key={r.id} type="button" onClick={() => openResource(r)} className="flex items-center justify-between gap-3 rounded-xl border border-cream/[0.09] bg-[rgb(22,27,15)] px-4 py-3 text-left hover:border-cream/25">
                          <div className="flex min-w-0 items-center gap-3">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                            <div className="min-w-0">
                              <div className="truncate font-sans text-[14px] font-semibold text-white">{r.title}</div>
                              {r.description && <div className="truncate font-serif text-[12.5px] text-cream/50">{r.description}</div>}
                            </div>
                          </div>
                          <span className="shrink-0 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-gold">{r.external_url ? 'Open ↗' : 'Download'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right — instructor / progress / included */}
              <aside className="flex flex-col gap-4 lg:sticky lg:top-[80px] lg:self-start">
                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] p-5">
                  <div className="flex items-center gap-3.5">
                    <img src={mikePortrait} alt={INSTRUCTOR.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                    <div>
                      <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/45">Your instructor</div>
                      <div className="font-sans text-[16px] font-bold text-white">{INSTRUCTOR.name}</div>
                    </div>
                  </div>
                  <p className="mt-3.5 font-serif text-[13.5px] leading-[1.6] text-cream/65">{INSTRUCTOR.bio}</p>
                </div>

                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/45">Your progress</span>
                    <span className="font-sans text-[15px] font-bold text-white">{progressPct}%</span>
                  </div>
                  <div className="mb-4 h-[6px] overflow-hidden rounded-full bg-cream/[0.12]">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${progressPct}%` }} />
                  </div>
                  <button
                    type="button"
                    disabled={!upNext && !decorated.some((e) => e.playable)}
                    onClick={() => play(upNext || decorated.find((e) => e.playable))}
                    className="flex w-full items-center justify-center gap-2 rounded-full border-none bg-gold px-5 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.1em] text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    {upNext
                      ? `Continue${upNext.week_number != null ? ` Week ${upNext.week_number}` : ''}`
                      : decorated.some((e) => e.playable)
                      ? 'Rewatch course'
                      : 'Nothing unlocked yet'}
                  </button>
                </div>

                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] p-5">
                  <div className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/45">Included</div>
                  <ul className="flex flex-col gap-2.5">
                    {INCLUDED.map((item) => (
                      <li key={item} className="flex items-center gap-2.5 font-serif text-[13.5px] text-cream/75">
                        <TickList />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  )
}
