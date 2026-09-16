import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { createCourse } from '../../lib/courses'

const TIERS = ['disciple', 'leader', 'pastor']
const inputCls = 'w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none'
const labelCls = 'mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50'

// Deliberately minimal (task #1): course creation used to be a big inline
// form on the courses list page (title, category, price, Stripe id, tiers,
// thumbnail, a seeded first episode — see git history on UploadCourses.jsx).
// All of that now lives on the full Details/Episodes/Resources editor
// (ManageCourse.jsx) instead — this page only collects the one truly
// required field (Title) plus a short description, creates a bare DRAFT
// course, and hands off to the editor immediately so the admin fills
// everything else in there. Visible tiers default to all three (editable
// later in Details) so a fresh draft is never accidentally invisible to
// everyone once published.
export default function NewCourse() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Enter a title.')
    setSubmitting(true)
    try {
      const created = await createCourse({
        title: title.trim(),
        description: description.trim(),
        status: 'draft',
        visibleTiers: TIERS,
      })
      navigate(`/admin/courses/${created.id}/edit`)
    } catch (err) {
      setError(err.message || 'Could not create this course.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/courses" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar searchPlaceholder="Search courses…" />
        <main className="mx-auto w-full max-w-[640px] flex-1 px-8 pb-16 pt-9">
          <Link to="/admin/courses" className="mb-4 inline-block font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/50 no-underline">
            ← All courses
          </Link>
          <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">New course</h1>
          <p className="mb-6 font-serif text-[15px] text-cream/60">
            Give it a title to start a draft — you'll fill in everything else (category, pricing, episodes, resources) on the next screen.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
            <div>
              <label className={labelCls}>Title</label>
              <input type="text" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description (optional)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
            </div>
            {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create draft & continue →'}
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}
