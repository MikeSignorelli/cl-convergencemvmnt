import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { adminListCourses, deleteCourse, deleteCourses, duplicateCourse } from '../../lib/courses'
import { formatPrice } from '../../lib/billing'
import { fetchUnresolvedCourseHealthFlags, runCourseHealthCheck } from '../../lib/courseHealth'

const STATUSES = ['draft', 'published', 'archived']
const ROLES = ['disciple', 'leader', 'pastor']
const LISTING_TYPES = ['membership', 'course']
const PAGE_SIZE = 20
const selectCls = 'w-auto cursor-pointer rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-2.5 font-serif text-[13.5px] text-cream outline-none'

// Labels for course_health_flags.flag_type (see migration 0029 and the
// course-health-check Edge Function) — shown in the banner below.
const HEALTH_FLAG_LABELS = {
  missing_video: 'Missing or invalid video',
  upcoming_no_video: 'Releasing soon — no video yet',
  broken_link: 'Vimeo link appears broken',
}
const HEALTH_FLAGS_PREVIEW_COUNT = 6

function capitalize(word) {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : word
}

function StatusBadge({ status }) {
  const colors = {
    published: { bg: 'rgba(155,192,138,0.16)', text: '#9BC08A' },
    draft: { bg: 'rgba(240,238,229,0.1)', text: 'rgba(240,238,229,0.6)' },
    archived: { bg: 'rgba(216,136,138,0.16)', text: '#D8888A' },
  }
  const c = colors[status] || colors.draft
  return (
    <span
      className="rounded-full px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{ background: c.bg, color: c.text }}
    >
      {status || 'draft'}
    </span>
  )
}

export default function UploadCourses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [listingTypeFilter, setListingTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [page, setPage] = useState(1)
  const [duplicatingId, setDuplicatingId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Course-health banner (task: course-health-check) — unresolved flags from
  // the most recent scheduled or manual run (see src/lib/courseHealth.js).
  const [healthFlags, setHealthFlags] = useState([])
  const [checkingHealth, setCheckingHealth] = useState(false)
  const [healthCheckMessage, setHealthCheckMessage] = useState('')

  async function refresh() {
    setLoading(true)
    try {
      setCourses(await adminListCourses())
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }
  async function refreshHealthFlags() {
    try {
      setHealthFlags(await fetchUnresolvedCourseHealthFlags())
    } catch {
      // Non-critical — the banner just stays empty/stale rather than
      // blocking the course list itself.
    }
  }
  useEffect(() => {
    refresh()
    refreshHealthFlags()
  }, [])

  // Manual "Check Vimeo links now" trigger (task: on-demand health check) —
  // runs the same Edge Function the external schedule calls, authenticated
  // as this admin instead of via the cron shared secret (see
  // course-health-check/index.ts's top-of-file note).
  async function handleCheckHealth() {
    setCheckingHealth(true)
    setHealthCheckMessage('')
    try {
      const result = await runCourseHealthCheck()
      const total =
        (result?.flagged?.missing_video || 0) +
        (result?.flagged?.upcoming_no_video || 0) +
        (result?.flagged?.broken_link || 0)
      setHealthCheckMessage(total === 0 ? 'No issues found.' : `Flagged ${total} episode${total === 1 ? '' : 's'} — see below.`)
      await refreshHealthFlags()
    } catch (err) {
      setHealthCheckMessage(err.message || 'Could not run the health check.')
    }
    setCheckingHealth(false)
  }

  async function handleDelete(course) {
    if (!window.confirm(`Remove “${course.title}” from the site? It disappears everywhere immediately, but nothing is permanently deleted.`)) return
    try {
      await deleteCourse(course.id)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Selects/clears every course matching the current filters, not just the
  // current page — a bulk action is most useful applied to "everything I
  // just filtered down to," not one page of 20 at a time.
  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const allSelected = filteredCourses.length > 0 && filteredCourses.every((c) => prev.has(c.id))
      return allSelected ? new Set() : new Set(filteredCourses.map((c) => c.id))
    })
  }

  async function handleBulkDelete() {
    const count = selectedIds.size
    if (count === 0) return
    if (
      !window.confirm(
        `Remove ${count} course${count === 1 ? '' : 's'} from the site? ${count === 1 ? 'It disappears' : 'They disappear'} everywhere immediately, but nothing is permanently deleted.`
      )
    )
      return
    setBulkDeleting(true)
    setError('')
    try {
      await deleteCourses([...selectedIds])
      setSelectedIds(new Set())
      await refresh()
    } catch (err) {
      setError(err.message)
    }
    setBulkDeleting(false)
  }

  async function handleDuplicate(course) {
    setError('')
    setDuplicatingId(course.id)
    try {
      const created = await duplicateCourse(course.id)
      navigate(`/admin/courses/${created.id}/edit`)
    } catch (err) {
      setError(err.message || 'Could not duplicate this course.')
      setDuplicatingId(null)
    }
  }

  // Client-side only, over the already-fetched admin list — no server-side
  // search endpoint needed at this scale (see task scope).
  const categories = useMemo(() => {
    const seen = []
    for (const c of courses) {
      if (c.category && !seen.includes(c.category)) seen.push(c.category)
    }
    return seen
  }, [courses])

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = courses.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q)) return false
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
      if (statusFilter !== 'all' && (c.status || 'draft') !== statusFilter) return false
      if (roleFilter !== 'all' && !(c.visible_tiers || []).includes(roleFilter)) return false
      if (listingTypeFilter !== 'all' && (c.listing_type || 'membership') !== listingTypeFilter) return false
      return true
    })
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title_asc':
          return a.title.localeCompare(b.title)
        case 'title_desc':
          return b.title.localeCompare(a.title)
        case 'created_asc':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'created_desc':
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })
  }, [courses, search, categoryFilter, statusFilter, roleFilter, listingTypeFilter, sortBy])

  // Reset to page 1 whenever the filtered set could change shape, so a stale
  // page number never shows a blank page of results. Selection is cleared
  // too — otherwise "Delete selected" could include courses the admin can no
  // longer see (and so can't double-check or deselect) after changing filters.
  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [search, categoryFilter, statusFilter, roleFilter, listingTypeFilter, sortBy])

  const pageCount = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageCourses = filteredCourses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/courses" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar searchPlaceholder="Search courses…" search={search} onSearch={setSearch} />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">Courses</h1>
              <p className="font-serif text-[15px] text-cream/60">
                Click a course to manage its details, episodes, and resources.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={handleCheckHealth}
                disabled={checkingHealth}
                className="cursor-pointer whitespace-nowrap rounded-full border border-cream/[0.16] bg-transparent px-5 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.1em] text-cream/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkingHealth ? 'Checking…' : 'Check Vimeo links'}
              </button>
              <Link
                to="/admin/courses/new"
                className="cursor-pointer rounded-full border-none bg-gold px-6 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink no-underline"
              >
                + New course
              </Link>
            </div>
          </div>

          {healthCheckMessage && (
            <p className="mb-4 font-serif text-[13px] text-cream/60">{healthCheckMessage}</p>
          )}

          {/* Course-health banner: unresolved course_health_flags from the latest
              scheduled or manual run (see course-health-check + migration 0029).
              Styled after the member dashboard's "finish your profile" nudge —
              a warm/attention gold, not destructive red, since nothing here is
              broken beyond an admin's attention. */}
          {healthFlags.length > 0 && (
            <div className="mb-6 rounded-cv-lg border border-gold/30 bg-gold/[0.08] px-5 py-4">
              <div className="mb-3 flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E9CF9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#E9CF9C]">
                  {healthFlags.length} episode{healthFlags.length === 1 ? '' : 's'} need attention
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {healthFlags.slice(0, HEALTH_FLAGS_PREVIEW_COUNT).map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 font-serif text-[13.5px] text-cream/75">
                    <span>
                      <span className="text-cream/90">{f.courseTitle}</span> — {f.lessonTitle}
                      <span className="text-cream/50"> · {HEALTH_FLAG_LABELS[f.flagType] || f.flagType}</span>
                    </span>
                    <Link
                      to={`/admin/courses/${f.courseId}/edit`}
                      className="shrink-0 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-gold no-underline"
                    >
                      View episodes →
                    </Link>
                  </li>
                ))}
              </ul>
              {healthFlags.length > HEALTH_FLAGS_PREVIEW_COUNT && (
                <p className="mt-2 font-serif text-[12.5px] text-cream/50">
                  +{healthFlags.length - HEALTH_FLAGS_PREVIEW_COUNT} more
                </p>
              )}
            </div>
          )}

          {error && <p className="mb-4 font-serif text-[13px] text-[#D8888A]">{error}</p>}

          {!loading && courses.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ colorScheme: 'dark' }} className={selectCls}>
                <option value="all">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ colorScheme: 'dark' }} className={selectCls}>
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{capitalize(s)}</option>
                ))}
              </select>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ colorScheme: 'dark' }} className={selectCls}>
                <option value="all">All roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{capitalize(r)}</option>
                ))}
              </select>
              <select value={listingTypeFilter} onChange={(e) => setListingTypeFilter(e.target.value)} style={{ colorScheme: 'dark' }} className={selectCls}>
                <option value="all">Membership + Courses</option>
                {LISTING_TYPES.map((t) => (
                  <option key={t} value={t}>{capitalize(t)}</option>
                ))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ colorScheme: 'dark' }} className={`${selectCls} ml-auto`}>
                <option value="created_desc">Newest first</option>
                <option value="created_asc">Oldest first</option>
                <option value="title_asc">Title A–Z</option>
                <option value="title_desc">Title Z–A</option>
              </select>
            </div>
          )}

          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center justify-between gap-4 rounded-cv-lg border border-[#D8888A]/30 bg-[#D8888A]/[0.08] px-5 py-3.5">
              <span className="font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#D8888A]">
                {selectedIds.size} course{selectedIds.size === 1 ? '' : 's'} selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/60"
                >
                  Clear selection
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="cursor-pointer whitespace-nowrap rounded-full border-none bg-[#D8888A] px-5 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkDeleting ? 'Deleting…' : `Delete selected (${selectedIds.size})`}
                </button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                  <th className="w-10 px-5 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all courses"
                      checked={filteredCourses.length > 0 && filteredCourses.every((c) => selectedIds.has(c.id))}
                      onChange={toggleSelectAll}
                      className="h-[15px] w-[15px] cursor-pointer accent-gold"
                    />
                  </th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Title</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Category</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Type</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Status</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Price</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Visible to</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} className="px-5 py-6 text-center font-serif text-cream/50">Loading…</td></tr>}
                {!loading && courses.length === 0 && <tr><td colSpan={8} className="px-5 py-6 text-center font-serif text-cream/50">No courses yet — add your first with “New course.”</td></tr>}
                {!loading && courses.length > 0 && filteredCourses.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-6 text-center font-serif text-cream/50">No courses match your search or filters.</td></tr>
                )}
                {!loading && pageCourses.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/courses/${c.id}/edit`)}
                    className="cursor-pointer border-b border-cream/[0.06] last:border-b-0 hover:bg-cream/[0.03]"
                  >
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${c.title}`}
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelected(c.id)}
                        className="h-[15px] w-[15px] cursor-pointer accent-gold"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-sans text-sm font-medium">
                      {c.title}
                      {c.featured && (
                        <span className="ml-2 rounded-full bg-gold/[0.16] px-2 py-0.5 font-sans text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#E9CF9C]">Featured</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{c.category || '—'}</td>
                    <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{capitalize(c.listing_type || 'membership')}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3.5 font-serif text-sm text-gold">{c.price_cents > 0 ? formatPrice(c.price_cents) : 'Membership only'}</td>
                    <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{c.visible_tiers.join(', ')}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <Link
                        to={`/admin/courses/${c.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-4 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-gold no-underline"
                      >
                        Manage →
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDuplicate(c) }}
                        disabled={duplicatingId === c.id}
                        className="mr-4 cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/60 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {duplicatingId === c.id ? 'Duplicating…' : 'Duplicate'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(c) }}
                        className="cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#D8888A]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredCourses.length > 0 && pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="font-serif text-[12.5px] text-cream/50">
                Page {currentPage} of {pageCount} · {filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="cursor-pointer rounded-full border border-cream/[0.14] bg-transparent px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage >= pageCount}
                  className="cursor-pointer rounded-full border border-cream/[0.14] bg-transparent px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
