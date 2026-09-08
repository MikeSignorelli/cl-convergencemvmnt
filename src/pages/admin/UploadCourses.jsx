import { useEffect, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { adminListCourses, createCourse, deleteCourse, uploadCourseThumbnail } from '../../lib/courses'
import { formatPrice } from '../../lib/billing'

const TIERS = ['disciple', 'leader', 'pastor']

export default function UploadCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibleTiers, setVisibleTiers] = useState(TIERS)
  const [videoUrl, setVideoUrl] = useState('')
  const [price, setPrice] = useState('')
  const [thumbnail, setThumbnail] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      setCourses(await adminListCourses())
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Enter a title.')
      return
    }
    if (!videoUrl.trim()) {
      setError('Add a video link.')
      return
    }
    if (visibleTiers.length === 0) {
      setError('Select at least one tier.')
      return
    }

    setSubmitting(true)
    try {
      let thumbnailPath = null
      if (thumbnail) {
        const uploaded = await uploadCourseThumbnail(thumbnail)
        thumbnailPath = uploaded.path
      }

      await createCourse({
        title: title.trim(),
        description: description.trim(),
        visibleTiers,
        thumbnailPath,
        videoUrl: videoUrl.trim(),
        priceCents: Math.round(parseFloat(price || '0') * 100) || 0,
      })

      setTitle('')
      setDescription('')
      setVisibleTiers(TIERS)
      setVideoUrl('')
      setPrice('')
      setThumbnail(null)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not save this course.')
    }
    setSubmitting(false)
  }

  async function handleDelete(course) {
    try {
      await deleteCourse(course.id, course.thumbnail_path)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/courses" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar searchPlaceholder="Search courses…" />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">
            Upload courses
          </h1>
          <p className="mb-6 font-serif text-[15px] text-cream/60">
            Link an existing video and choose which tiers can see it.
          </p>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Video link
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://vimeo.com/…"
                  className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>
              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Thumbnail (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                  className="w-full font-serif text-[13.5px] text-cream/70"
                />
              </div>
            </div>

            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Price (USD, one-time purchase — 0 for free)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="497.00"
                className="w-full max-w-[200px] rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
              />
              <p className="mt-1.5 font-serif text-[12px] text-cream/40">
                Sets the price shown to members. Also requires a matching Stripe Price — see supabase/functions/README.md — before real checkout will work.
              </p>
            </div>

            {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Add course'}
            </button>
          </form>

          <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Title</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Price</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Visible to</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Video</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center font-serif text-cream/50">Loading…</td>
                  </tr>
                )}
                {!loading && courses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center font-serif text-cream/50">No courses yet.</td>
                  </tr>
                )}
                {!loading &&
                  courses.map((c) => (
                    <tr key={c.id} className="border-b border-cream/[0.06] last:border-b-0">
                      <td className="px-5 py-3.5 font-sans text-sm font-medium">{c.title}</td>
                      <td className="px-5 py-3.5 font-serif text-sm text-gold">{formatPrice(c.price_cents)}</td>
                      <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{c.visible_tiers.join(', ')}</td>
                      <td className="px-5 py-3.5 font-serif text-sm text-cream/60 max-w-[260px] truncate">
                        <a href={c.video_url} target="_blank" rel="noreferrer" className="text-gold no-underline">
                          {c.video_url}
                        </a>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
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
        </main>
      </div>
    </div>
  )
}
