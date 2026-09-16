import { useEffect, useState } from 'react'
import { listCourseResources, createResource, deleteResource, getResourceDownloadUrl, uploadResourceFile, validateResourceFile, updateResourcePosition } from '../../lib/resources'

const TIERS = ['disciple', 'leader', 'pastor']
const inputCls = 'w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none'
const labelCls = 'mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50'

export default function CourseResourcesPanel({ courseId }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [externalUrl, setExternalUrl] = useState('')

  async function refresh() {
    try {
      setResources(await listCourseResources(courseId))
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
    setTitle('')
    setDescription('')
    setFile(null)
    setExternalUrl('')
    setError('')
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Enter a title.')
    if (!file && !externalUrl.trim()) return setError('Upload a file or paste a link.')
    if (file) {
      const msg = validateResourceFile(file)
      if (msg) return setError(msg)
    }
    setSubmitting(true)
    try {
      let filePath = null
      let fileSize = null
      let mimeType = null
      if (file) {
        filePath = await uploadResourceFile(file)
        fileSize = file.size
        mimeType = file.type
      }
      await createResource({
        courseId,
        title: title.trim(),
        description: description.trim(),
        visibleTiers: TIERS, // course resources are gated by course access, not tier
        filePath,
        fileSize,
        mimeType,
        externalUrl: externalUrl.trim() || null,
      })
      resetForm()
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not add this resource.')
    }
    setSubmitting(false)
  }

  // Swaps this resource's position with its neighbor in the given direction
  // (-1 up, +1 down) -- same "adjacent swap" approach as reordering doesn't
  // need a full renumber, just the two affected rows.
  async function handleMove(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= resources.length) return
    const current = resources[index]
    const neighbor = resources[targetIndex]
    try {
      await Promise.all([
        updateResourcePosition(current.id, neighbor.position),
        updateResourcePosition(neighbor.id, current.position),
      ])
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleOpen(r) {
    try {
      if (r.file_path) {
        const url = await getResourceDownloadUrl(r.file_path)
        window.open(url, '_blank', 'noopener')
      } else if (r.external_url) {
        window.open(r.external_url, '_blank', 'noopener')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(r) {
    try {
      await deleteResource(r.id, r.file_path)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <form onSubmit={handleAdd} className="mb-8 flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
        <p className="font-serif text-[13.5px] text-cream/55">
          PDFs, worksheets, and the course summary (.docx) — visible to anyone who has access to this course, at the end of the course page and in their Resources.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course summary" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>File (PDF / DOCX, under 25MB)</label>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full pt-3 font-serif text-[13.5px] text-cream/70"
            />
          </div>
          <div>
            <label className={labelCls}>…or an external link</label>
            <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://…" className={inputCls} />
          </div>
        </div>
        {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
        <button type="submit" disabled={submitting} className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Adding…' : 'Add resource'}
        </button>
      </form>

      <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
              <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">#</th>
              <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Resource</th>
              <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Type</th>
              <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-5 py-6 text-center font-serif text-cream/50">Loading…</td></tr>}
            {!loading && resources.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center font-serif text-cream/50">No materials yet — add the summary or a worksheet above.</td></tr>}
            {!loading && resources.map((r, i) => (
              <tr key={r.id} className="border-b border-cream/[0.06] last:border-b-0 align-middle">
                <td className="px-5 py-3.5 font-serif text-sm text-cream/50">{i + 1}</td>
                <td className="px-5 py-3.5">
                  <div className="font-sans text-sm font-medium">{r.title}</div>
                  {r.description && <div className="font-serif text-[13px] text-cream/50">{r.description}</div>}
                </td>
                <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{r.file_path ? 'File' : 'Link'}</td>
                <td className="whitespace-nowrap px-5 py-3.5 text-right">
                  <button type="button" onClick={() => handleMove(i, -1)} disabled={i === 0} className="mr-2 cursor-pointer border-none bg-transparent font-sans text-[15px] text-cream/50 disabled:cursor-not-allowed disabled:opacity-25" aria-label="Move up">↑</button>
                  <button type="button" onClick={() => handleMove(i, 1)} disabled={i === resources.length - 1} className="mr-4 cursor-pointer border-none bg-transparent font-sans text-[15px] text-cream/50 disabled:cursor-not-allowed disabled:opacity-25" aria-label="Move down">↓</button>
                  <button type="button" onClick={() => handleOpen(r)} className="mr-4 cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-gold">Open</button>
                  <button type="button" onClick={() => handleDelete(r)} className="cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#D8888A]">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
