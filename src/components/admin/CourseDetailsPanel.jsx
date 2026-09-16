import { useState } from 'react'
import { updateCourse, uploadCourseThumbnail, courseThumbnailUrl } from '../../lib/courses'

const TIERS = ['disciple', 'leader', 'pastor']
const inputCls = 'w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none'
const labelCls = 'mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50'

export default function CourseDetailsPanel({ course, onSaved }) {
  const [title, setTitle] = useState(course.title || '')
  const [description, setDescription] = useState(course.description || '')
  const [category, setCategory] = useState(course.category || '')
  const [durationLabel, setDurationLabel] = useState(course.duration_label || '')
  const [featured, setFeatured] = useState(!!course.featured)
  const [price, setPrice] = useState(course.price_cents ? (course.price_cents / 100).toString() : '')
  const [stripePriceId, setStripePriceId] = useState(course.stripe_price_id || '')
  const [visibleTiers, setVisibleTiers] = useState(course.visible_tiers?.length ? course.visible_tiers : TIERS)
  const [thumbnail, setThumbnail] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const currentThumb = courseThumbnailUrl(course.thumbnail_path)

  function toggleTier(tier) {
    setVisibleTiers((prev) => (prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
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
      await updateCourse(course.id, fields)
      setThumbnail(null)
      setSaved(true)
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Could not save the course.')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
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
        <label className={labelCls}>Course thumbnail</label>
        <div className="flex items-center gap-4">
          {currentThumb && <img src={currentThumb} alt="" className="h-14 w-24 rounded-md object-cover" />}
          <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} className="font-serif text-[13.5px] text-cream/70" />
        </div>
        <p className="mt-1.5 font-serif text-[12px] text-cream/40">Leave empty to keep the current image.</p>
      </div>

      {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="font-serif text-[13px] text-[#9BC08A]">Saved ✓</span>}
      </div>
    </form>
  )
}
