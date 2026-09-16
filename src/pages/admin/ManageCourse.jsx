import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import CourseDetailsPanel from '../../components/admin/CourseDetailsPanel'
import EpisodesPanel from '../../components/admin/EpisodesPanel'
import CourseResourcesPanel from '../../components/admin/CourseResourcesPanel'
import { adminListCourses, updateCourse } from '../../lib/courses'

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'episodes', label: 'Episodes' },
  { key: 'resources', label: 'Resources' },
]

const AUTOSAVE_INTERVAL_MS = 30000

function formatSavedTime(date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function ManageCourse() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState('details')

  // Task #2/#3/#4 state: the Details tab is the only tab whose pending edits
  // can be lost (Episodes/Resources save per-row immediately, as before).
  const detailsRef = useRef(null)
  const [detailsDirty, setDetailsDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [savingAction, setSavingAction] = useState(null) // 'save' | 'draft' | 'publish' | null
  const [saveError, setSaveError] = useState('')

  // Refs mirroring the state above for use inside the beforeunload/click/
  // interval listeners below, which are set up once (empty dep arrays) and
  // would otherwise close over stale values.
  const detailsDirtyRef = useRef(false)
  useEffect(() => {
    detailsDirtyRef.current = detailsDirty
  }, [detailsDirty])
  const tabRef = useRef(tab)
  useEffect(() => {
    tabRef.current = tab
  }, [tab])

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

  // Task #3, part 1: warn on an actual tab-close/refresh while the Details
  // tab has unsaved edits.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!detailsDirtyRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Task #3, part 2: react-router-dom is on v6.26 here (see package.json) with
  // a plain <BrowserRouter>, not a data router (createBrowserRouter /
  // RouterProvider) — useBlocker throws outside a data router, so it isn't an
  // option. Falling back to the simpler approach the task allows instead: a
  // capture-phase click listener that confirms before any in-app navigation
  // away from this page while the Details tab is dirty. Doing it this way
  // (rather than a local onClick on just the breadcrumb link below) also
  // catches MemberSidebar's own nav links without that shared component
  // needing to know anything about this page's dirty state.
  useEffect(() => {
    function handleDocumentClick(e) {
      if (!detailsDirtyRef.current) return
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = e.target.closest?.('a')
      if (!anchor || anchor.target === '_blank') return // e.g. "Preview as user" — a new tab loses nothing here
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (!window.confirm('You have unsaved changes on the Details tab that haven’t been saved yet. Leave this page anyway?')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('click', handleDocumentClick, true)
    return () => document.removeEventListener('click', handleDocumentClick, true)
  }, [])

  // Silently saves the Details tab's pending edits without changing status —
  // shared by the 30s autosave timer and by switching away from the Details
  // tab. Errors are swallowed on purpose: surfacing them would defeat the
  // point of a background autosave (the admin's own inline "Save" flow
  // already shows validation errors when they save by hand).
  async function autoSaveDetails() {
    if (!detailsRef.current) return
    try {
      const ok = await detailsRef.current.save()
      if (ok) setLastSavedAt(new Date())
    } catch {
      /* swallowed — see comment above */
    }
  }

  // Task #4: autosave every ~30s while the Details tab is dirty.
  useEffect(() => {
    const id = setInterval(() => {
      if (tabRef.current === 'details' && detailsDirtyRef.current) autoSaveDetails()
    }, AUTOSAVE_INTERVAL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Task #4: also autosave on tab switch — awaited so it completes (using
  // the still-mounted CourseDetailsPanel/ref) before that panel unmounts.
  // Because this never actually loses data, switching between Details /
  // Episodes / Resources doesn't also need the confirm() from task #3 —
  // that guard is reserved for navigation that truly leaves this page (see
  // the click-listener effect above).
  async function handleTabClick(key) {
    if (key === tab) return
    if (tab === 'details' && detailsDirtyRef.current) {
      await autoSaveDetails()
    }
    setTab(key)
  }

  // Sticky bar actions (task #2). On the Details tab these go through the
  // panel's own imperative `save` (validates + saves every Details field,
  // optionally with a new status). From Episodes/Resources — which already
  // save their own row-level edits immediately — "Save as draft"/"Publish"
  // still work by flipping just the course's status directly; a plain
  // "Save" is disabled there since there's nothing pending to save.
  async function handleStickyAction(action) {
    setSaveError('')
    setSavingAction(action)
    try {
      if (tab === 'details' && detailsRef.current) {
        const statusOverride = action === 'draft' ? 'draft' : action === 'publish' ? 'published' : undefined
        const ok = await detailsRef.current.save(statusOverride)
        if (ok) setLastSavedAt(new Date())
      } else if (action !== 'save') {
        await updateCourse(course.id, { status: action === 'draft' ? 'draft' : 'published' })
        setLastSavedAt(new Date())
        await loadCourse()
      }
    } catch (err) {
      setSaveError(err.message || 'Could not save.')
    }
    setSavingAction(null)
  }

  const stickyBtnCls = 'cursor-pointer rounded-full border border-cream/[0.16] bg-transparent px-6 py-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-cream/80 disabled:cursor-not-allowed disabled:opacity-40'

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
              <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
                <h1 className="font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">{course.title}</h1>
                {/* Task #5: lets an admin see a draft/archived course exactly as a
                    member would, without publishing it first — CourseDetail.jsx's
                    own access check exempts admins from the status gate. */}
                <a
                  href={`/courses/${course.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-sans text-[11.5px] font-semibold uppercase tracking-[0.1em] text-gold no-underline"
                >
                  Preview as user ↗
                </a>
              </div>
              <p className="mb-6 font-serif text-[15px] text-cream/60">
                {course.visible_tiers?.length ? `Visible to ${course.visible_tiers.join(', ')}` : 'Not assigned to any tier yet'}
                {course.price_cents > 0 ? ` · also sold standalone` : ''}
              </p>

              <div className="mb-7 flex gap-1 border-b border-cream/[0.1]">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleTabClick(t.key)}
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

              {tab === 'details' && (
                <CourseDetailsPanel ref={detailsRef} course={course} onSaved={loadCourse} onDirtyChange={setDetailsDirty} />
              )}
              {tab === 'episodes' && <EpisodesPanel courseId={course.id} weeks={course.weeks} />}
              {tab === 'resources' && <CourseResourcesPanel courseId={course.id} />}
            </>
          )}
        </main>

        {/* Task #2: persistent sticky Save / Save as draft / Publish bar —
            present regardless of active tab, mirroring the app's other sticky
            bar (CourseDetail.jsx's member-facing header). */}
        {course && (
          <div className="sticky bottom-0 z-30 border-t border-cream/[0.09] bg-ink/95 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 px-8 py-4">
              <div className="font-serif text-[12.5px] text-cream/50">
                {saveError && <span className="text-[#D8888A]">{saveError}</span>}
                {!saveError && savingAction && 'Saving…'}
                {!saveError && !savingAction && tab === 'details' && detailsDirty && 'Unsaved changes'}
                {!saveError && !savingAction && !(tab === 'details' && detailsDirty) && lastSavedAt && `Last saved ${formatSavedTime(lastSavedAt)}`}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleStickyAction('save')}
                  disabled={tab !== 'details' || !detailsDirty || !!savingAction}
                  className={stickyBtnCls}
                >
                  {savingAction === 'save' ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => handleStickyAction('draft')}
                  disabled={!!savingAction}
                  className={stickyBtnCls}
                >
                  {savingAction === 'draft' ? 'Saving…' : 'Save as draft'}
                </button>
                <button
                  type="button"
                  onClick={() => handleStickyAction('publish')}
                  disabled={!!savingAction}
                  className="cursor-pointer rounded-full border-none bg-gold px-6 py-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingAction === 'publish' ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
