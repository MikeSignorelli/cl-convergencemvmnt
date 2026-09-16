import { useEffect, useState } from 'react'
import { uploadCourseThumbnail } from '../../lib/courses'
import { adminListLessons, createLesson, updateLesson, deleteLesson, swapLessonPositions } from '../../lib/courseLessons'

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

export default function EpisodesPanel({ courseId }) {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [extraInfo, setExtraInfo] = useState('')
  const [durationLabel, setDurationLabel] = useState('')
  const [releaseAt, setReleaseAt] = useState('')
  const [thumbnail, setThumbnail] = useState(null)

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

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setVideoUrl('')
    setDescription('')
    setExtraInfo('')
    setDurationLabel('')
    setReleaseAt('')
    setThumbnail(null)
    setError('')
  }
  function startEdit(ep) {
    setEditingId(ep.id)
    setTitle(ep.title || '')
    setVideoUrl(ep.video_url || '')
    setDescription(ep.description || '')
    setExtraInfo(ep.extra_info || '')
    setDurationLabel(ep.duration_label || '')
    setReleaseAt(toLocalInput(ep.release_at))
    setThumbnail(null)
    setError('')
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Enter an episode title.')
    if (!videoUrl.trim()) return setError('Add the video link.')
    setSubmitting(true)
    try {
      const fields = {
        title: title.trim(),
        description: description.trim(),
        extraInfo: extraInfo.trim(),
        videoUrl: videoUrl.trim(),
        durationLabel: durationLabel.trim(),
        releaseAt: releaseAt ? new Date(releaseAt).toISOString() : null,
      }
      if (thumbnail) {
        const uploaded = await uploadCourseThumbnail(thumbnail)
        fields.thumbnailPath = uploaded.path
      }
      if (editingId) await updateLesson(editingId, fields)
      else await createLesson({ courseId, ...fields, position: episodes.length })
      resetForm()
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not save this episode.')
    }
    setSubmitting(false)
  }

  async function handleDelete(ep) {
    try {
      await deleteLesson(ep.id, ep.thumbnail_path)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function move(index, dir) {
    const other = index + dir
    if (other < 0 || other >= episodes.length) return
    try {
      await swapLessonPositions(episodes[index], episodes[other])
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <form onSubmit={handleAdd} className="mb-8 flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Episode title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Week 1 · Identifying Root Beliefs" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Video link (Vimeo)</label>
            <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://vimeo.com/…" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Description (optional)</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Further info (optional)</label>
          <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} rows={2} className={`${inputCls} resize-y`} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Duration (optional)</label>
            <input type="text" value={durationLabel} onChange={(e) => setDurationLabel(e.target.value)} placeholder="24 min" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Release date (optional)</label>
            <input type="datetime-local" value={releaseAt} onChange={(e) => setReleaseAt(e.target.value)} style={{ colorScheme: 'dark' }} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Thumbnail (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} className="w-full pt-3 font-serif text-[13.5px] text-cream/70" />
          </div>
        </div>
        {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add episode'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="cursor-pointer rounded-full border border-cream/20 bg-transparent px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/70">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
              <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">#</th>
              <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Episode</th>
              <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Release</th>
              <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-5 py-6 text-center font-serif text-cream/50">Loading…</td></tr>}
            {!loading && episodes.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center font-serif text-cream/50">No episodes yet — add the first above.</td></tr>}
            {!loading && episodes.map((ep, i) => (
              <tr key={ep.id} className="border-b border-cream/[0.06] last:border-b-0 align-middle">
                <td className="px-5 py-3.5 font-serif text-sm text-cream/50">{i + 1}</td>
                <td className="px-5 py-3.5 font-sans text-sm font-medium">{ep.title}</td>
                <td className="px-5 py-3.5 font-serif text-sm">
                  {ep.released ? (
                    <span className="text-[#9BC08A]">{ep.release_at ? `Live · ${fmtDate(ep.release_at)}` : 'Available now'}</span>
                  ) : (
                    <span className="text-[#E9CF9C]">Drips · {fmtDate(ep.release_at)}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-right">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="mr-2 cursor-pointer border-none bg-transparent font-sans text-[15px] text-cream/50 disabled:cursor-not-allowed disabled:opacity-25" aria-label="Move up">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === episodes.length - 1} className="mr-4 cursor-pointer border-none bg-transparent font-sans text-[15px] text-cream/50 disabled:cursor-not-allowed disabled:opacity-25" aria-label="Move down">↓</button>
                  <button type="button" onClick={() => startEdit(ep)} className="mr-4 cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-gold">Edit</button>
                  <button type="button" onClick={() => handleDelete(ep)} className="cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#D8888A]">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
