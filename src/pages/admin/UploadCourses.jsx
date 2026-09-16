import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { adminListCourses, createCourse, deleteCourse, uploadCourseThumbnail } from '../../lib/courses'
import { createLesson } from '../../lib/courseLessons'
import { formatPrice } from '../../lib/billing'

const TIERS = ['disciple', 'leader', 'pastor']
const inputCls = 'w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none'
const labelCls = 'mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50'

export default function UploadCourses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [durationLabel, setDurationLabel] = useState('')
  const [featured, setFeatured] = useState(false)
  const [price, setPrice] = useState('')
  const [stripePriceId, setStripePriceId] = useState('')
  const [visibleTiers, setVisibleTiers] = useState(TIERS)
  const [thumbnail, setThumbnail] = useState(null)
  const [firstTitle, setFirstTitle] = useState('')
  const [firstVideoUrl, setFirstVideoUrl] = useState('')
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

  function resetForm() {
    setTitle('')
    setDescription('')
    setCategory('')
    setDurationLabel('')
    setFeatured(false)
    setPrice('')
    setStripePriceId('')
    setVisibleTiers(TIERS)
    setThumbnail(null)
    setFirstTitle('')
    setFirstVideoUrl('')
    setError('')
  }

  function toggleTier(tier) {
    setVisibleTiers((prev) => (prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Enter a title.')
    if (visibleTiers.length === 0) return setError('Select at least one tier.')
    setSubmitting(true)
    try {
      const fields = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        durationLabel: durationLabel.trim(),
        featured,
        priceCents: Math.round(parseFloat(price || '0') * 100) || 0,
        stripePriceId: stripePriceId.trim(),
        visibleTiers,
      }
      if (thumbnail) {
        const uploaded = await uploadCourseThumbnail(thumbnail)
        fields.thumbnailPath = uploaded.path
      }
      const created = await createCourse(fields)
      // If a first video link was given, seed it as Week 1 so the course isn't
      // empty — the rest of the episodes get added from the course's Episodes tab.
      if (firstVideoUrl.trim() && created?.id) {
        await createLesson({
          courseId: created.id,
          title: firstTitle.trim() || 'Week 1',
          videoUrl: firstVideoUrl.trim(),
          weekNumber: 1,
          position: 0,
        })
      }
      resetForm()
      setShowForm(false)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not create this course.')
    }
    setSubmitting(false)
  }

  async function handleDelete(course) {
    if (!window.confirm(`Delete “${course.title}” and all its episodes? This can't be undone.`)) return
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
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">Courses</h1>
              <p className="font-serif text-[15px] text-cream/60">
                Click a course to manage its details, episodes, and resources.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowForm((v) => !v); setError('') }}
              className="shrink-0 cursor-pointer rounded-full border-none bg-gold px-6 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink"
            >
              {showForm ? 'Close' : '+ New course'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
              <div>
                <label className={labelCls}>Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description (optional)</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Freedom & Healing" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Duration / episodes (optional)</label>
                  <input type="text" value={durationLabel} onChange={(e) => setDurationLabel(e.target.value)} placeholder="12 weeks · 36 episodes" className={inputCls} />
                </div>
              </div>
              <label className="flex w-fit cursor-pointer items-center gap-2.5 font-serif text-[13.5px] text-cream/70">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Feature this course in the library's hero banner
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Standalone price (USD — 0 for membership-only)</label>
                  <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="497.00" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Stripe Price ID (optional)</label>
                  <input type="text" value={stripePriceId} onChange={(e) => setStripePriceId(e.target.value)} placeholder="price_…" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Visible to (which memberships see this course)</label>
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
                <label className={labelCls}>Course thumbnail (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} className="w-full font-serif text-[13.5px] text-cream/70" />
              </div>

              <div className="rounded-[10px] border border-dashed border-cream/[0.14] px-5 py-5">
                <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/50">First episode (optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Episode name</label>
                    <input type="text" value={firstTitle} onChange={(e) => setFirstTitle(e.target.value)} placeholder="Introduction" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Video link (Vimeo)</label>
                    <input type="url" value={firstVideoUrl} onChange={(e) => setFirstVideoUrl(e.target.value)} placeholder="https://vimeo.com/…" className={inputCls} />
                  </div>
                </div>
                <p className="mt-2.5 font-serif text-[12px] text-cream/40">
                  Paste a Vimeo link to publish it as Week 1 right away. Add the remaining weeks — each with its own release date — from the course's Episodes tab.
                </p>
              </div>

              {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
              <button type="submit" disabled={submitting} className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? 'Creating…' : 'Create course'}
              </button>
            </form>
          )}

          {error && !showForm && <p className="mb-4 font-serif text-[13px] text-[#D8888A]">{error}</p>}

          <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Title</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Category</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Price</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Visible to</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} className="px-5 py-6 text-center font-serif text-cream/50">Loading…</td></tr>}
                {!loading && courses.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-center font-serif text-cream/50">No courses yet — add your first with “New course.”</td></tr>}
                {!loading && courses.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/courses/${c.id}`)}
                    className="cursor-pointer border-b border-cream/[0.06] last:border-b-0 hover:bg-cream/[0.03]"
                  >
                    <td className="px-5 py-3.5 font-sans text-sm font-medium">
                      {c.title}
                      {c.featured && (
                        <span className="ml-2 rounded-full bg-gold/[0.16] px-2 py-0.5 font-sans text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#E9CF9C]">Featured</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{c.category || '—'}</td>
                    <td className="px-5 py-3.5 font-serif text-sm text-gold">{c.price_cents > 0 ? formatPrice(c.price_cents) : 'Membership only'}</td>
                    <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{c.visible_tiers.join(', ')}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <Link
                        to={`/admin/courses/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-4 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-gold no-underline"
                      >
                        Manage →
                      </Link>
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
        </main>
      </div>
    </div>
  )
}
