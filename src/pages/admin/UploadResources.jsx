import { useEffect, useRef, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { useAuth } from '../../lib/AuthContext'
import { listCourses } from '../../lib/courses'
import {
  createResource,
  deleteResource,
  getResourceDownloadUrl,
  listResources,
  uploadResourceFile,
  validateResourceFile,
} from '../../lib/resources'

const TIERS = ['disciple', 'leader', 'pastor']

export default function UploadResources() {
  const { isAdmin } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const fileInputRef = useRef(null)
  const [resources, setResources] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibleTiers, setVisibleTiers] = useState(TIERS)
  const [file, setFile] = useState(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [courseId, setCourseId] = useState('')
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listCourses().then(setCourses).catch(() => {})
  }, [])

  const courseTitle = (id) => courses.find((c) => c.id === id)?.title

  async function refresh() {
    setLoading(true)
    try {
      setResources(await listResources())
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  function toggleTier(tier) {
    setVisibleTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    )
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const validationError = validateResourceFile(f)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Enter a title.')
      return
    }
    if (!file && !externalUrl.trim()) {
      setError('Attach a file or add an external link.')
      return
    }
    if (visibleTiers.length === 0) {
      setError('Select at least one tier.')
      return
    }

    setSubmitting(true)
    try {
      let filePath = null
      if (file) filePath = await uploadResourceFile(file)

      await createResource({
        title: title.trim(),
        description: description.trim(),
        visibleTiers,
        filePath,
        externalUrl: externalUrl.trim() || null,
        courseId: courseId || null,
      })

      setTitle('')
      setDescription('')
      setVisibleTiers(TIERS)
      setFile(null)
      setExternalUrl('')
      setCourseId('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowForm(false)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not save this resource.')
    }
    setSubmitting(false)
  }

  const searchQ = query.trim().toLowerCase()
  const visibleResources = searchQ
    ? resources.filter((r) => `${r.title || ''} ${r.description || ''}`.toLowerCase().includes(searchQ))
    : resources

  async function handleDelete(resource) {
    try {
      await deleteResource(resource.id, resource.file_path)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleOpen(resource) {
    if (resource.external_url) {
      window.open(resource.external_url, '_blank', 'noopener')
      return
    }
    try {
      const url = await getResourceDownloadUrl(resource.file_path)
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/resources" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar
          searchPlaceholder="Search resources…"
          search={query}
          onSearch={setQuery}
          actionLabel={isAdmin ? 'Upload Resources' : undefined}
          actionOnClick={() => setShowForm((v) => !v)}
        />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">
            Resources
          </h1>
          <p className="mb-6 font-serif text-[15px] text-cream/60">
            PDFs, templates, and links for your tier.
          </p>

          {isAdmin && showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6"
          >
            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
              />
            </div>
            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
              />
            </div>

            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Visible to
              </label>
              <div className="flex flex-wrap gap-2.5">
                {TIERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => toggleTier(tier)}
                    className="cursor-pointer rounded-full px-5 py-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em]"
                    style={
                      visibleTiers.includes(tier)
                        ? { background: '#C2A064', color: '#171C10' }
                        : { background: 'transparent', border: '1px solid rgba(240,238,229,0.16)', color: 'rgba(240,238,229,0.7)' }
                    }
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Attach to a course (optional)
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
              >
                <option value="">General resource (tier-gated)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <p className="mt-1.5 font-serif text-[12px] text-cream/40">
                Course-attached files (content PDFs, the summary doc) show inside that course and only to people who can access it.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="w-full font-serif text-[13.5px] text-cream/70"
                />
              </div>
              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Or external link
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>
            </div>

            {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Add resource'}
            </button>
          </form>
          )}

          <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Title</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Visible to</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Type</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />
                  {isAdmin && <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-5 py-6 text-center font-serif text-cream/50">Loading…</td>
                  </tr>
                )}
                {!loading && visibleResources.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-5 py-6 text-center font-serif text-cream/50">
                      {resources.length === 0 ? 'No resources yet.' : `No resources match “${query}”.`}
                    </td>
                  </tr>
                )}
                {!loading &&
                  visibleResources.map((r) => (
                    <tr key={r.id} className="border-b border-cream/[0.06] last:border-b-0">
                      <td className="px-5 py-3.5 font-sans text-sm font-medium">{r.title}</td>
                      <td className="px-5 py-3.5 font-serif text-sm text-cream/60">
                        {r.course_id ? (courseTitle(r.course_id) || 'Course') : r.visible_tiers.join(', ')}
                      </td>
                      <td className="px-5 py-3.5 font-serif text-sm text-cream/60">
                        {r.file_path ? 'File' : 'Link'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpen(r)}
                          className="cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-gold"
                        >
                          Open
                        </button>
                      </td>
                      {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(r)}
                          className="cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#D8888A]"
                        >
                          Delete
                        </button>
                      </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
