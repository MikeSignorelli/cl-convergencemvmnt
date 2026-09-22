import { useEffect, useMemo, useRef, useState } from 'react'
import { uploadCourseThumbnail } from '../../lib/courses'
import {
  adminListLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  duplicateLesson,
} from '../../lib/courseLessons'
import { extractVimeoId, fetchVimeoOEmbed, formatDurationLabel } from '../../lib/vimeo'
import { parseCsv, partitionCsvRows } from '../../lib/csv'

function fmtDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const inputCls = 'w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none'
const labelCls = 'mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50'
const smallLinkBtnCls = 'cursor-pointer border-none bg-transparent p-0 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-gold'
const badgeCls = 'ml-2 whitespace-nowrap rounded-full px-2 py-[2px] font-sans text-[9.5px] font-semibold uppercase tracking-[0.08em]'

// ----------------------------------------------------------------------------
// Position scheme (task #5, drag-and-drop across weeks): `position` stays a
// single global ordinal — the member Course page (CourseDetail.jsx) and
// fetchCourseLessonsStats() both order/read the whole course's lessons by it
// with no week partition, so it has to keep sorting week 1 before week 2
// everywhere, not just inside this admin panel. Rather than renumber the
// entire course on every reorder, each week gets its own numeric "slot"
// (position = weekSlot(week) * POSITION_WEEK_GAP + indexWithinWeek) — a
// reorder or cross-week move then only ever has to recompute the two week
// lists actually touched, and weeks can never collide or interleave.
// Pre-existing rows (added before this scheme existed) keep whatever
// position they already have until the admin actually reorders/moves them.
const POSITION_WEEK_GAP = 1000
const UNASSIGNED_WEEK_SLOT = 9999
function weekSlot(weekNumber) {
  return weekNumber == null ? UNASSIGNED_WEEK_SLOT : weekNumber
}
// UI grouping keys are either a week number or the literal string
// 'unassigned' (legacy episodes saved with no week) — this converts a key
// back to the null the lib/DB layer expects.
function keyToWeekNumber(key) {
  return key === 'unassigned' ? null : key
}

// Shared per-line/per-row Vimeo lookup for bulk-add (task #3) and CSV import
// (task #4): derives vimeo_id and best-effort fetches oEmbed metadata for a
// title fallback, duration, and thumbnail. Never throws — a failed/private
// video just comes back with only vimeoId set and `oembedError` filled in,
// so one bad line/row never blocks the rest of a batch.
async function buildEpisodeFromLink({ videoUrl, title, fallbackTitle }) {
  const result = {
    vimeoId: extractVimeoId(videoUrl),
    title: (title || '').trim(),
    durationLabel: '',
    durationSeconds: null,
    durationSource: null,
    thumbnailUrl: null,
    oembedError: null,
  }
  try {
    const meta = await fetchVimeoOEmbed(videoUrl)
    if (!result.title) result.title = meta.title || fallbackTitle
    if (meta.duration != null) {
      result.durationSeconds = Math.round(meta.duration)
      result.durationLabel = formatDurationLabel(meta.duration)
      result.durationSource = 'auto'
    }
    result.thumbnailUrl = meta.thumbnailUrl || null
  } catch (err) {
    result.oembedError = err.message || 'Could not fetch video info from Vimeo.'
    if (!result.title) result.title = fallbackTitle
  }
  return result
}

function emptyForm() {
  return {
    title: '',
    weekNumber: '',
    videoUrl: '',
    description: '',
    extraInfo: '',
    durationLabel: '',
    durationTouched: false,
    durationSource: null,
    durationSeconds: null,
    vimeoId: null,
    vimeoThumbnailUrl: null,
    releaseAt: '',
    thumbnail: null,
    isOpenAccess: false,
  }
}

function EpisodeBadges({ ep }) {
  return (
    <>
      {ep.is_open_access && <span className={badgeCls} style={{ background: 'rgba(155,192,138,0.18)', color: '#9BC08A' }}>Free preview</span>}
      {ep.is_upcoming && <span className={badgeCls} style={{ background: 'rgba(233,207,156,0.18)', color: '#E9CF9C' }}>Upcoming</span>}
      {ep.is_overdue_no_video && <span className={badgeCls} style={{ background: 'rgba(216,136,138,0.18)', color: '#D8888A' }}>Overdue — no video</span>}
    </>
  )
}

export default function EpisodesPanel({ courseId, weeks }) {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // formTarget drives which single week section (if any) shows the shared
  // add/edit/bulk-paste form — only one is ever open at a time, mirroring
  // the single shared form the panel had before this grouped-by-week layout.
  const [formTarget, setFormTarget] = useState(null) // { weekNumber, mode: 'add'|'edit'|'bulk', editingId?, originalWeekNumber? }
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [vimeoLoading, setVimeoLoading] = useState(false)
  const [vimeoError, setVimeoError] = useState('')

  const [bulkText, setBulkText] = useState('')
  const [bulkParsing, setBulkParsing] = useState(false)
  const [bulkRows, setBulkRows] = useState(null) // null = still on the paste step; array once parsed
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkResults, setBulkResults] = useState(null)

  const [csvOpen, setCsvOpen] = useState(false)
  const [csvRows, setCsvRows] = useState(null) // { valid, invalid } from partitionCsvRows
  const [csvError, setCsvError] = useState('')
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvSummary, setCsvSummary] = useState(null)
  const csvFileInputRef = useRef(null)

  // { id, weekKey } of the row currently being dragged (native HTML5 DnD —
  // task #5 asks for no new dependency). A plain ref: it never needs to
  // trigger a re-render on its own.
  const dragRef = useRef(null)

  async function refresh() {
    try {
      setEpisodes(await adminListLessons(courseId))
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  // Group the flat, position-ordered list into per-week arrays (task #1).
  // Episodes saved before week_number existed (or with it left blank) fall
  // into 'unassigned' rather than being silently dropped from the panel.
  const groupsByWeek = useMemo(() => {
    const groups = {}
    episodes.forEach((ep) => {
      const key = ep.week_number || 'unassigned'
      if (!groups[key]) groups[key] = []
      groups[key].push(ep)
    })
    Object.values(groups).forEach((list) => list.sort((a, b) => a.position - b.position))
    return groups
  }, [episodes])
  const unassigned = groupsByWeek.unassigned || []

  // How many "Week N Episodes" sections to render: the course's configured
  // weeks value, but never fewer than whatever week numbers already exist on
  // its episodes (defensive — a course whose weeks count got reduced after
  // episodes were already assigned to a later week should never hide them),
  // and always at least 1.
  const weeksCount = useMemo(() => {
    const maxAssignedWeek = episodes.reduce((max, ep) => Math.max(max, ep.week_number || 0), 0)
    return Math.max(weeks || 0, maxAssignedWeek, 1)
  }, [weeks, episodes])

  function listForKey(key) {
    return (key === 'unassigned' ? unassigned : groupsByWeek[key]) || []
  }

  // Persists position (and week_number, when it changed) for every lesson in
  // `orderedLessons`, which must already be in the desired final order for
  // `weekNumber` (null for the Unassigned group) — see the position-scheme
  // comment near POSITION_WEEK_GAP above. Skips a write when nothing about
  // that lesson actually changed.
  async function persistWeekOrder(weekNumber, orderedLessons) {
    const slot = weekSlot(weekNumber)
    const writes = []
    orderedLessons.forEach((lesson, index) => {
      const nextPosition = slot * POSITION_WEEK_GAP + index
      const patch = {}
      if (lesson.position !== nextPosition) patch.position = nextPosition
      if (lesson.week_number !== weekNumber) patch.weekNumber = weekNumber
      if (Object.keys(patch).length > 0) writes.push(updateLesson(lesson.id, patch))
    })
    await Promise.all(writes)
  }

  async function reorderWithinWeek(weekKey, fromIndex, toIndex) {
    const list = listForKey(weekKey)
    if (fromIndex < 0 || toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) return
    const next = list.slice()
    const [item] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, item)
    try {
      await persistWeekOrder(keyToWeekNumber(weekKey), next)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function moveAcrossWeeks(episodeId, fromKey, toKey, toIndex) {
    if (fromKey === toKey) return
    const fromList = listForKey(fromKey).slice()
    const toList = listForKey(toKey).slice()
    const fromIdx = fromList.findIndex((ep) => ep.id === episodeId)
    if (fromIdx === -1) return
    const [item] = fromList.splice(fromIdx, 1)
    const insertAt = Math.min(Math.max(toIndex, 0), toList.length)
    toList.splice(insertAt, 0, item)
    try {
      await Promise.all([
        persistWeekOrder(keyToWeekNumber(fromKey), fromList),
        persistWeekOrder(keyToWeekNumber(toKey), toList),
      ])
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  // ---- Native HTML5 drag-and-drop (task #5) ---------------------------------
  function handleDragStart(e, ep, weekKey) {
    dragRef.current = { id: ep.id, weekKey }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', ep.id) // required by some browsers to allow the drop
  }
  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  async function handleDropAtIndex(e, weekKey, targetIndex) {
    e.preventDefault()
    e.stopPropagation()
    const dragged = dragRef.current
    dragRef.current = null
    if (!dragged) return
    if (dragged.weekKey === weekKey) {
      const fromIndex = listForKey(weekKey).findIndex((ep) => ep.id === dragged.id)
      if (fromIndex === -1) return
      // Dropping below its own current row shifts the target index left by
      // one once the dragged row is removed from the array.
      const adjusted = targetIndex > fromIndex ? targetIndex - 1 : targetIndex
      await reorderWithinWeek(weekKey, fromIndex, adjusted)
    } else {
      await moveAcrossWeeks(dragged.id, dragged.weekKey, weekKey, targetIndex)
    }
  }
  async function handleDropAtEnd(e, weekKey) {
    e.preventDefault()
    const dragged = dragRef.current
    dragRef.current = null
    if (!dragged) return
    const list = listForKey(weekKey)
    if (dragged.weekKey === weekKey) {
      const fromIndex = list.findIndex((ep) => ep.id === dragged.id)
      if (fromIndex === -1 || fromIndex === list.length - 1) return
      await reorderWithinWeek(weekKey, fromIndex, list.length - 1)
    } else {
      await moveAcrossWeeks(dragged.id, dragged.weekKey, weekKey, list.length)
    }
  }

  // ---- Add / edit form -------------------------------------------------------
  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function startAdd(weekNumber) {
    setForm({ ...emptyForm(), weekNumber: String(weekNumber) })
    setFormTarget({ weekNumber, mode: 'add' })
    setFormError('')
    setVimeoError('')
  }
  function startEdit(ep) {
    setForm({
      title: ep.title || '',
      weekNumber: ep.week_number ? String(ep.week_number) : '',
      videoUrl: ep.video_url || '',
      description: ep.description || '',
      extraInfo: ep.extra_info || '',
      durationLabel: ep.duration_label || '',
      // A previously MANUAL value is protected from being silently
      // overwritten by a fresh oEmbed fetch during this edit session (e.g.
      // the admin re-enters/corrects the video link); a previously auto (or
      // never-set) value is left refillable, same as it was originally.
      durationTouched: ep.duration_source === 'manual',
      durationSource: ep.duration_source || null,
      durationSeconds: ep.duration_seconds ?? null,
      vimeoId: ep.vimeo_id || null,
      vimeoThumbnailUrl: ep.vimeo_thumbnail_url || null,
      releaseAt: toLocalInput(ep.release_at),
      thumbnail: null,
      isOpenAccess: !!ep.is_open_access,
    })
    setFormTarget({ weekNumber: ep.week_number || 'unassigned', mode: 'edit', editingId: ep.id, originalWeekNumber: ep.week_number ?? null })
    setFormError('')
    setVimeoError('')
  }
  function startBulk(weekNumber) {
    setFormTarget({ weekNumber, mode: 'bulk' })
    setBulkText('')
    setBulkRows(null)
    setBulkResults(null)
    setFormError('')
  }
  function closeForm() {
    setFormTarget(null)
    setForm(emptyForm())
    setFormError('')
    setVimeoError('')
  }

  // On video-link entry (task #2): derive vimeo_id immediately, then
  // best-effort fetch oEmbed metadata on blur (not on every keystroke) —
  // with a loading flag on the field and a graceful inline error that never
  // blocks a manual save.
  async function handleVideoUrlBlur() {
    const url = form.videoUrl.trim()
    const vimeoId = extractVimeoId(url)
    setField('vimeoId', vimeoId)
    if (!url || !vimeoId) return
    setVimeoLoading(true)
    setVimeoError('')
    try {
      const meta = await fetchVimeoOEmbed(url)
      setForm((f) => ({
        ...f,
        vimeoId,
        vimeoThumbnailUrl: meta.thumbnailUrl || f.vimeoThumbnailUrl,
        durationSeconds: meta.duration != null ? Math.round(meta.duration) : f.durationSeconds,
        // Keep the touched-flag pattern (mirrors the Details tab's slug
        // field): only overwrite the visible Duration text — and flip its
        // source to "auto" — while the admin hasn't edited it directly.
        durationLabel: f.durationTouched ? f.durationLabel : formatDurationLabel(meta.duration) || f.durationLabel,
        durationSource: f.durationTouched ? f.durationSource : 'auto',
      }))
    } catch (err) {
      setVimeoError(err.message || 'Could not fetch video info from Vimeo — you can still save this episode manually.')
    }
    setVimeoLoading(false)
  }
  function handleDurationChange(e) {
    setForm((f) => ({ ...f, durationLabel: e.target.value, durationTouched: true, durationSource: 'manual' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) return setFormError('Enter an episode title.')
    if (!form.videoUrl.trim()) return setFormError('Add the video link.')
    setFormSubmitting(true)
    try {
      const weekNumberValue = form.weekNumber ? parseInt(form.weekNumber, 10) : null
      const fields = {
        title: form.title.trim(),
        weekNumber: weekNumberValue,
        description: form.description.trim(),
        extraInfo: form.extraInfo.trim(),
        videoUrl: form.videoUrl.trim(),
        durationLabel: form.durationLabel.trim(),
        durationSource: form.durationLabel.trim() ? form.durationSource || 'manual' : null,
        durationSeconds: form.durationSeconds,
        vimeoId: form.vimeoId || extractVimeoId(form.videoUrl),
        thumbnailUrl: form.vimeoThumbnailUrl,
        releaseAt: form.releaseAt ? new Date(form.releaseAt).toISOString() : null,
        isOpenAccess: form.isOpenAccess,
      }
      if (form.thumbnail) {
        const uploaded = await uploadCourseThumbnail(form.thumbnail)
        fields.thumbnailPath = uploaded.path
      }
      if (formTarget.mode === 'edit') {
        await updateLesson(formTarget.editingId, fields)
        if (weekNumberValue !== formTarget.originalWeekNumber) {
          // Moved to a different week from the form itself (an alternative
          // to dragging the row) — append it to the end of the destination
          // week and close the gap left in the source week.
          const fromKey = formTarget.originalWeekNumber ?? 'unassigned'
          const toKey = weekNumberValue ?? 'unassigned'
          await moveAcrossWeeks(formTarget.editingId, fromKey, toKey, listForKey(toKey).length)
        }
      } else {
        const weekKey = weekNumberValue ?? 'unassigned'
        fields.position = weekSlot(weekNumberValue) * POSITION_WEEK_GAP + listForKey(weekKey).length
        await createLesson({ courseId, ...fields })
      }
      closeForm()
      await refresh()
    } catch (err) {
      setFormError(err.message || 'Could not save this episode.')
    }
    setFormSubmitting(false)
  }

  async function handleDelete(ep) {
    try {
      await deleteLesson(ep.id, ep.thumbnail_path)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDuplicate(ep, weekKey) {
    try {
      const position = weekSlot(keyToWeekNumber(weekKey)) * POSITION_WEEK_GAP + listForKey(weekKey).length
      await duplicateLesson(ep, position)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  // ---- Bulk "paste multiple Vimeo links" (task #3) --------------------------
  // Two steps: paste links -> parse (fetch each line's Vimeo oEmbed title/
  // thumbnail/duration guess) -> review/edit every row (title, description,
  // release date, optional thumbnail override) -> create. This is what lets
  // bulk-add capture the same per-episode metadata the single Add form
  // already does, instead of only ever saving a bare link with an
  // auto-derived title.
  async function handleBulkParse(e) {
    e.preventDefault()
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return setFormError('Paste at least one Vimeo link.')
    setFormError('')
    setBulkParsing(true)
    const rows = await Promise.all(
      lines.map(async (line, i) => {
        const vimeoId = extractVimeoId(line)
        if (!vimeoId) {
          return { line, vimeoId: null, invalid: true, invalidReason: 'Not a recognizable Vimeo link.' }
        }
        const built = await buildEpisodeFromLink({ videoUrl: line, title: '', fallbackTitle: `Episode ${i + 1}` })
        return {
          line,
          vimeoId: built.vimeoId,
          title: built.title,
          description: '',
          releaseAt: '',
          thumbnailFile: null,
          vimeoThumbnailUrl: built.thumbnailUrl,
          durationLabel: built.durationLabel,
          durationSeconds: built.durationSeconds,
          durationSource: built.durationSource,
          oembedError: built.oembedError,
          invalid: false,
        }
      })
    )
    setBulkRows(rows)
    setBulkParsing(false)
  }

  function updateBulkRow(index, patch) {
    setBulkRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  function removeBulkRow(index) {
    setBulkRows((rows) => rows.filter((_, i) => i !== index))
  }
  function backToBulkPaste() {
    setBulkRows(null)
  }

  async function handleBulkCreate() {
    const rows = bulkRows.filter((r) => !r.invalid)
    if (rows.length === 0) return setFormError('No valid episodes to add.')
    setFormError('')
    setBulkSubmitting(true)
    const weekKey = formTarget.weekNumber
    const weekNumber = keyToWeekNumber(weekKey)
    const existingCount = listForKey(weekKey).length
    const results = []
    let created = 0
    for (const row of rows) {
      try {
        let thumbnailPath
        if (row.thumbnailFile) {
          const uploaded = await uploadCourseThumbnail(row.thumbnailFile)
          thumbnailPath = uploaded.path
        }
        await createLesson({
          courseId,
          title: row.title.trim() || 'Untitled episode',
          description: row.description.trim(),
          videoUrl: row.line,
          weekNumber,
          vimeoId: row.vimeoId,
          durationLabel: row.durationLabel,
          durationSeconds: row.durationSeconds,
          durationSource: row.durationSource,
          thumbnailPath,
          thumbnailUrl: row.vimeoThumbnailUrl,
          releaseAt: row.releaseAt ? new Date(row.releaseAt).toISOString() : null,
          position: weekSlot(weekNumber) * POSITION_WEEK_GAP + existingCount + created,
        })
        created += 1
        results.push({ line: row.line, status: 'success', title: row.title, warning: row.oembedError })
      } catch (err) {
        results.push({ line: row.line, status: 'error', message: err.message || 'Could not save this episode.' })
      }
    }
    setBulkResults(results)
    setBulkRows(null)
    setBulkSubmitting(false)
    setBulkText('')
    await refresh()
  }

  // ---- CSV import (task #4) --------------------------------------------------
  async function handleCsvFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError('')
    setCsvSummary(null)
    try {
      const text = await file.text()
      setCsvRows(partitionCsvRows(parseCsv(text)))
    } catch (err) {
      setCsvError(err.message || 'Could not read this CSV file.')
      setCsvRows(null)
    }
  }
  async function handleCsvImport() {
    if (!csvRows || csvRows.valid.length === 0) return
    setCsvImporting(true)
    setCsvError('')
    const counters = {}
    const results = []
    for (const { row, rowIndex } of csvRows.valid) {
      const weekNumber = parseInt(row.week, 10)
      if (counters[weekNumber] == null) counters[weekNumber] = listForKey(weekNumber).length
      try {
        const built = await buildEpisodeFromLink({ videoUrl: row.video_link, title: row.title, fallbackTitle: `Episode ${rowIndex}` })
        await createLesson({
          courseId,
          title: built.title,
          description: (row.description || '').trim(),
          videoUrl: row.video_link.trim(),
          weekNumber,
          releaseAt: row.release_date?.trim() ? new Date(row.release_date).toISOString() : null,
          vimeoId: built.vimeoId,
          durationLabel: built.durationLabel,
          durationSeconds: built.durationSeconds,
          durationSource: built.durationSource,
          thumbnailUrl: row.thumbnail_url?.trim() || built.thumbnailUrl,
          position: weekSlot(weekNumber) * POSITION_WEEK_GAP + counters[weekNumber],
        })
        counters[weekNumber] += 1
        results.push({ rowIndex, title: built.title, status: 'success', warning: built.oembedError })
      } catch (err) {
        results.push({ rowIndex, title: row.title, status: 'error', message: err.message || 'Could not save this row.' })
      }
    }
    setCsvSummary({ succeeded: results.filter((r) => r.status === 'success').length, failed: results.filter((r) => r.status === 'error').length, results })
    setCsvImporting(false)
    setCsvRows(null)
    if (csvFileInputRef.current) csvFileInputRef.current.value = ''
    await refresh()
  }

  const csvPreviewRows = useMemo(() => {
    if (!csvRows) return []
    return [
      ...csvRows.valid.map((r) => ({ ...r, ok: true })),
      ...csvRows.invalid.map((r) => ({ ...r, ok: false })),
    ].sort((a, b) => a.rowIndex - b.rowIndex)
  }, [csvRows])

  // ---- Shared add/edit/bulk form, rendered inline inside whichever week
  // section is currently the formTarget --------------------------------------
  function renderForm() {
    if (formTarget.mode === 'bulk') {
      if (!bulkRows) {
        return (
          <form onSubmit={handleBulkParse} className="mb-6 flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
            <div>
              <label className={labelCls}>Paste one Vimeo link per line</label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={6}
                placeholder={'https://vimeo.com/111111111\nhttps://vimeo.com/222222222'}
                className={`${inputCls} resize-y font-sans`}
              />
              <p className="mt-1.5 font-serif text-[12px] text-cream/40">
                Each line becomes its own episode in this week. Next you'll get a chance to set each one's title, description, release date, and thumbnail before anything is saved.
              </p>
            </div>
            {formError && <p className="font-serif text-[13px] text-[#D8888A]">{formError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={bulkParsing} className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60">
                {bulkParsing ? 'Looking up videos…' : 'Continue'}
              </button>
              <button type="button" onClick={closeForm} className="cursor-pointer rounded-full border border-cream/20 bg-transparent px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/70">
                Cancel
              </button>
            </div>
            {bulkResults && (
              <div className="flex flex-col gap-1.5 border-t border-cream/[0.09] pt-4">
                {bulkResults.map((r, i) => (
                  <p key={i} className="font-serif text-[12.5px]" style={{ color: r.status === 'success' ? '#9BC08A' : '#D8888A' }}>
                    {r.status === 'success' ? '✓' : '✗'} {r.line} — {r.status === 'success' ? `Added as "${r.title}"${r.warning ? ' (Vimeo lookup failed, saved manually)' : ''}` : r.message}
                  </p>
                ))}
              </div>
            )}
          </form>
        )
      }

      return (
        <div className="mb-6 flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
          <p className="font-serif text-[12.5px] text-cream/50">
            Review and edit each episode below, then add them all at once.
          </p>
          {formError && <p className="font-serif text-[13px] text-[#D8888A]">{formError}</p>}
          <div className="flex flex-col gap-4">
            {bulkRows.map((row, i) => (
              <div key={row.line + i} className="rounded-[10px] border border-cream/[0.1] bg-cream/[0.03] p-4">
                {row.invalid ? (
                  <p className="font-serif text-[13px] text-[#D8888A]">{row.line} — {row.invalidReason}</p>
                ) : (
                  <>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="truncate font-serif text-[12px] text-cream/40">{row.line}</p>
                      <button type="button" onClick={() => removeBulkRow(i)} className="shrink-0 cursor-pointer border-none bg-transparent font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#D8888A]">
                        Remove
                      </button>
                    </div>
                    {row.oembedError && (
                      <p className="mb-3 font-serif text-[12px] text-[#E9CF9C]">Couldn't fetch video info from Vimeo — you can still fill this in manually.</p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Episode name</label>
                        <input type="text" value={row.title} onChange={(e) => updateBulkRow(i, { title: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Release date (optional)</label>
                        <input type="datetime-local" value={row.releaseAt} onChange={(e) => updateBulkRow(i, { releaseAt: e.target.value })} style={{ colorScheme: 'dark' }} className={inputCls} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className={labelCls}>Description (optional)</label>
                      <input type="text" value={row.description} onChange={(e) => updateBulkRow(i, { description: e.target.value })} className={inputCls} />
                    </div>
                    <div className="mt-3">
                      <label className={labelCls}>Thumbnail (optional)</label>
                      <input type="file" accept="image/*" onChange={(e) => updateBulkRow(i, { thumbnailFile: e.target.files?.[0] || null })} className="w-full pt-2 font-serif text-[13px] text-cream/70" />
                      {!row.thumbnailFile && row.vimeoThumbnailUrl && <p className="mt-1 font-serif text-[11px] text-cream/40">Using Vimeo's thumbnail</p>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleBulkCreate} disabled={bulkSubmitting} className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60">
              {bulkSubmitting ? 'Adding…' : `Add ${bulkRows.filter((r) => !r.invalid).length} episode${bulkRows.filter((r) => !r.invalid).length === 1 ? '' : 's'}`}
            </button>
            <button type="button" onClick={backToBulkPaste} disabled={bulkSubmitting} className="cursor-pointer rounded-full border border-cream/20 bg-transparent px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/70">
              Back
            </button>
            <button type="button" onClick={closeForm} disabled={bulkSubmitting} className="cursor-pointer border-none bg-transparent font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/50">
              Cancel
            </button>
          </div>
        </div>
      )
    }

    return (
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
        <div className="grid grid-cols-[130px_1fr_1fr] gap-4">
          <div>
            <label className={labelCls}>Week</label>
            <select value={form.weekNumber} onChange={(e) => setField('weekNumber', e.target.value)} className={inputCls}>
              <option value="">Unassigned</option>
              {Array.from({ length: weeksCount }, (_, i) => i + 1).map((wk) => (
                <option key={wk} value={wk}>Week {wk}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Episode name</label>
            <input type="text" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Identifying Root Beliefs" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Video link (Vimeo)</label>
            <input
              type="url"
              value={form.videoUrl}
              onChange={(e) => setField('videoUrl', e.target.value)}
              onBlur={handleVideoUrlBlur}
              placeholder="https://vimeo.com/…"
              className={inputCls}
            />
            {vimeoLoading && <p className="mt-1.5 font-serif text-[12px] text-cream/50">Fetching video info from Vimeo…</p>}
            {!vimeoLoading && vimeoError && <p className="mt-1.5 font-serif text-[12px] text-[#D8888A]">{vimeoError}</p>}
          </div>
        </div>
        <div>
          <label className={labelCls}>Description (optional)</label>
          <input type="text" value={form.description} onChange={(e) => setField('description', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Further info (optional)</label>
          <textarea value={form.extraInfo} onChange={(e) => setField('extraInfo', e.target.value)} rows={2} className={`${inputCls} resize-y`} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Duration (optional)</label>
            <input type="text" value={form.durationLabel} onChange={handleDurationChange} placeholder="24 min" className={inputCls} />
            {form.durationSource && <p className="mt-1.5 font-serif text-[11px] text-cream/40">{form.durationSource === 'auto' ? 'From Vimeo' : 'Set manually'}</p>}
          </div>
          <div>
            <label className={labelCls}>Release date (optional)</label>
            <input type="datetime-local" value={form.releaseAt} onChange={(e) => setField('releaseAt', e.target.value)} style={{ colorScheme: 'dark' }} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Thumbnail (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setField('thumbnail', e.target.files?.[0] || null)} className="w-full pt-3 font-serif text-[13.5px] text-cream/70" />
            {!form.thumbnail && form.vimeoThumbnailUrl && <p className="mt-1.5 font-serif text-[11px] text-cream/40">Using Vimeo's thumbnail</p>}
          </div>
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2.5 font-serif text-[13.5px] text-cream/70">
          <input type="checkbox" checked={form.isOpenAccess} onChange={(e) => setField('isOpenAccess', e.target.checked)} />
          Always accessible (free preview, ignores membership/purchase gating)
        </label>
        {formError && <p className="font-serif text-[13px] text-[#D8888A]">{formError}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={formSubmitting} className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60">
            {formSubmitting ? 'Saving…' : formTarget.mode === 'edit' ? 'Save changes' : 'Add episode'}
          </button>
          <button type="button" onClick={closeForm} className="cursor-pointer rounded-full border border-cream/20 bg-transparent px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/70">
            Cancel
          </button>
        </div>
      </form>
    )
  }

  function renderWeekTable(weekKey, list, { showAddControls }) {
    return (
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-sans text-[15px] font-bold uppercase tracking-[0.08em] text-white/85">
            {weekKey === 'unassigned' ? 'Unassigned Episodes' : `Week ${weekKey} Episodes`}
          </h3>
          {showAddControls && (
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => startAdd(weekKey)} className={smallLinkBtnCls}>+ Add episode</button>
              <button type="button" onClick={() => startBulk(weekKey)} className={smallLinkBtnCls}>Paste multiple Vimeo links</button>
            </div>
          )}
        </div>

        {formTarget && formTarget.weekNumber === weekKey && renderForm()}

        <div
          className="overflow-hidden rounded-cv-lg border border-cream/[0.09]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropAtEnd(e, weekKey)}
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">#</th>
                <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Episode</th>
                <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Duration</th>
                <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Release</th>
                <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center font-serif text-cream/50">
                    No episodes in this week yet{showAddControls ? ' — add one above, or drag one here from another week.' : '.'}
                  </td>
                </tr>
              )}
              {list.map((ep, i) => (
                <tr
                  key={ep.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, ep, weekKey)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropAtIndex(e, weekKey, i)}
                  className="cursor-grab border-b border-cream/[0.06] align-middle last:border-b-0"
                >
                  <td className="px-5 py-3.5 font-serif text-sm text-cream/50">{i + 1}</td>
                  <td className="px-5 py-3.5 font-sans text-sm font-medium">
                    {ep.title}
                    <EpisodeBadges ep={ep} />
                  </td>
                  <td className="px-5 py-3.5 font-serif text-sm text-cream/70">{ep.duration_label || '—'}</td>
                  <td className="px-5 py-3.5 font-serif text-sm">
                    {ep.released ? (
                      <span className="text-[#9BC08A]">{ep.release_at ? `Live · ${fmtDate(ep.release_at)}` : 'Available now'}</span>
                    ) : (
                      <span className="text-[#E9CF9C]">Drips · {fmtDate(ep.release_at)}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <button type="button" onClick={() => reorderWithinWeek(weekKey, i, i - 1)} disabled={i === 0} className="mr-2 cursor-pointer border-none bg-transparent font-sans text-[15px] text-cream/50 disabled:cursor-not-allowed disabled:opacity-25" aria-label="Move up">↑</button>
                    <button type="button" onClick={() => reorderWithinWeek(weekKey, i, i + 1)} disabled={i === list.length - 1} className="mr-4 cursor-pointer border-none bg-transparent font-sans text-[15px] text-cream/50 disabled:cursor-not-allowed disabled:opacity-25" aria-label="Move down">↓</button>
                    <button type="button" onClick={() => startEdit(ep)} className="mr-4 cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-gold">Edit</button>
                    <button type="button" onClick={() => handleDuplicate(ep, weekKey)} className="mr-4 cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/60">Duplicate</button>
                    <button type="button" onClick={() => handleDelete(ep)} className="cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#D8888A]">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-5">
        <div>
          <p className="font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-cream/80">Bulk import</p>
          <p className="mt-1 font-serif text-[13px] text-cream/50">Upload a CSV to add many episodes at once, across any week.</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/templates/episodes-import-template.csv" download="episodes-import-template.csv" className="font-serif text-[12.5px] text-cream/60 underline">
            Download template
          </a>
          <button type="button" onClick={() => setCsvOpen((v) => !v)} className="cursor-pointer whitespace-nowrap rounded-full border border-cream/[0.16] bg-transparent px-5 py-2.5 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-cream/80">
            {csvOpen ? 'Close' : 'Import CSV'}
          </button>
        </div>
      </div>

      {csvOpen && (
        <div className="mb-8 flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
          <div>
            <label className={labelCls}>CSV file</label>
            <input ref={csvFileInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvFileChange} className="w-full font-serif text-[13.5px] text-cream/70" />
            <p className="mt-1.5 font-serif text-[12px] text-cream/40">Columns: week, title, video_link, description (optional), release_date (optional), thumbnail_url (optional — a direct image link; leave blank to use Vimeo's own thumbnail).</p>
          </div>
          {csvError && <p className="font-serif text-[13px] text-[#D8888A]">{csvError}</p>}

          {csvPreviewRows.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-cv-lg border border-cream/[0.09]">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                      <th className="px-4 py-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-cream/50">Row</th>
                      <th className="px-4 py-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-cream/50">Week</th>
                      <th className="px-4 py-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-cream/50">Title</th>
                      <th className="px-4 py-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-cream/50">Video link</th>
                      <th className="px-4 py-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-cream/50">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreviewRows.map((r) => (
                      <tr key={r.rowIndex} className="border-b border-cream/[0.06] last:border-b-0" style={!r.ok ? { background: 'rgba(216,136,138,0.08)' } : undefined}>
                        <td className="px-4 py-2.5 font-serif text-[13px] text-cream/60">{r.rowIndex}</td>
                        <td className="px-4 py-2.5 font-serif text-[13px] text-cream/80">{r.row.week}</td>
                        <td className="px-4 py-2.5 font-serif text-[13px] text-cream/80">{r.row.title}</td>
                        <td className="max-w-[220px] truncate px-4 py-2.5 font-serif text-[13px] text-cream/60">{r.row.video_link}</td>
                        <td className="px-4 py-2.5 font-serif text-[12.5px]">
                          {r.ok ? <span className="text-[#9BC08A]">Valid</span> : <span className="text-[#D8888A]">{r.errors.join('; ')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCsvImport}
                  disabled={csvImporting || csvRows.valid.length === 0}
                  className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {csvImporting ? 'Importing…' : `Import ${csvRows.valid.length} valid row${csvRows.valid.length === 1 ? '' : 's'}`}
                </button>
                {csvRows.invalid.length > 0 && <span className="font-serif text-[12.5px] text-cream/50">{csvRows.invalid.length} row{csvRows.invalid.length === 1 ? '' : 's'} will be skipped.</span>}
              </div>
            </>
          )}

          {csvSummary && (
            <div className="flex flex-col gap-1.5 border-t border-cream/[0.09] pt-4">
              <p className="font-serif text-[13px] text-cream/70">Imported {csvSummary.succeeded} episode{csvSummary.succeeded === 1 ? '' : 's'}{csvSummary.failed ? `, ${csvSummary.failed} failed` : ''}.</p>
              {csvSummary.results.filter((r) => r.status === 'error').map((r) => (
                <p key={r.rowIndex} className="font-serif text-[12.5px] text-[#D8888A]">Row {r.rowIndex}: {r.message}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="mb-4 font-serif text-[13px] text-[#D8888A]">{error}</p>}
      {loading && <p className="font-serif text-cream/50">Loading…</p>}

      {!loading && (
        <>
          {Array.from({ length: weeksCount }, (_, i) => i + 1).map((weekNumber) =>
            <div key={weekNumber}>{renderWeekTable(weekNumber, groupsByWeek[weekNumber] || [], { showAddControls: true })}</div>
          )}
          {unassigned.length > 0 && renderWeekTable('unassigned', unassigned, { showAddControls: false })}
        </>
      )}
    </>
  )
}
