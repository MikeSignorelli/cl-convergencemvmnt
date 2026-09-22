import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { updateCourse, uploadCourseThumbnail, courseThumbnailUrl, isCourseSlugTaken, fetchCourseLessonsStats } from '../../lib/courses'
import { listCategories, createCategory } from '../../lib/courseCategories'
import { slugify } from '../../lib/slug'

const ADD_NEW_CATEGORY = '__add_new__'

const TIERS = ['disciple', 'leader', 'pastor']
const STATUSES = ['draft', 'published', 'archived']
const inputCls = 'w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none'
const labelCls = 'mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50'
const toggleBtnCls = 'cursor-pointer rounded-full px-5 py-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em]'
const toggleOnStyle = { background: '#C2A064', color: '#171C10' }
const toggleOffStyle = { background: 'transparent', border: '1px solid rgba(240,238,229,0.16)', color: 'rgba(240,238,229,0.7)' }

// Formats the read-only "Duration & episodes" summary from each lesson's
// duration_seconds/week_number (see fetchCourseLessonsStats) plus the
// course's own (live, not-yet-saved) weeks value.
function formatLessonsSummary(stats, weeksValue) {
  const episodeCount = stats.length
  const totalSeconds = stats.reduce((sum, l) => sum + (l.duration_seconds || 0), 0)
  const totalMinutes = Math.round(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  const parts = [`${episodeCount} episode${episodeCount === 1 ? '' : 's'}`, `${durationText} total`]
  if (weeksValue) parts.push(`${weeksValue} week${weeksValue === 1 ? '' : 's'}`)
  return parts.join(', ')
}

// Guard for task #6: block a DECREASE in weeks while a later week still has
// episodes attached, naming which week(s) so the admin knows what to move
// or delete first. Only ever called when weeksValue is actually lower than
// the course's last-saved weeks value.
function findWeeksDecreaseError(stats, weeksValue) {
  const countsByWeek = {}
  stats.forEach((lesson) => {
    if (lesson.week_number != null && lesson.week_number > weeksValue) {
      countsByWeek[lesson.week_number] = (countsByWeek[lesson.week_number] || 0) + 1
    }
  })
  const weekNumbers = Object.keys(countsByWeek).map(Number).sort((a, b) => a - b)
  if (weekNumbers.length === 0) return null
  const detail = weekNumbers
    .map((w) => `Week ${w} still has ${countsByWeek[w]} episode${countsByWeek[w] === 1 ? '' : 's'}`)
    .join('; ')
  return `${detail} — move or delete them before reducing to ${weeksValue} week${weeksValue === 1 ? '' : 's'}.`
}

// Design note (task #2, ManageCourse sticky Save/Draft/Publish bar): this
// panel used to own its save button outright. The sticky bar now needs to
// trigger a save from OUTSIDE this component (and, for autosave, without a
// human ever pressing anything). Two ways to get there were on the table:
// (a) lift all ~20 of this form's fields into ManageCourse.jsx as controlled
// props, or (b) leave the fields right here and expose an imperative `save`
// method via forwardRef/useImperativeHandle, plus an onDirtyChange callback
// so the parent knows when there's something TO save. (b) is the smaller,
// far less invasive diff — every field stays exactly where its own
// change-handler already lives — so that's what's implemented below. The
// panel's own submit button/"Saved" checkmark are gone; ManageCourse's
// sticky bar is now the only Save/Save as draft/Publish control, and it
// shows its own "Last saved" indicator instead.
const CourseDetailsPanel = forwardRef(function CourseDetailsPanel({ course, onSaved, onDirtyChange }, ref) {
  const [title, setTitle] = useState(course.title || '')
  const [description, setDescription] = useState(course.description || '')
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState(course.category_id || '')
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')
  // duration_label itself is no longer editable here (see the read-only
  // "Duration & episodes" summary below) — its stored value is left
  // untouched on save since it's simply omitted from the `fields` patch.
  const [slug, setSlug] = useState(course.slug || slugify(course.title || ''))
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugError, setSlugError] = useState('')
  const [shortDescription, setShortDescription] = useState(course.short_description || '')
  const [status, setStatus] = useState(course.status || 'published')
  const [isSpecialProgram, setIsSpecialProgram] = useState(!!course.is_special_program)
  const [accessMode, setAccessMode] = useState(course.access_mode || 'open')
  const [weeks, setWeeks] = useState(course.weeks != null ? String(course.weeks) : '')
  const [level, setLevel] = useState(course.level || '')
  const [language, setLanguage] = useState(course.language || '')
  const [learningOutcomes, setLearningOutcomes] = useState(course.learning_outcomes || '')
  const [prerequisites, setPrerequisites] = useState(course.prerequisites || '')
  const [lessonsStats, setLessonsStats] = useState(null) // null while loading
  const [featured, setFeatured] = useState(!!course.featured)
  const [price, setPrice] = useState(course.price_cents ? (course.price_cents / 100).toString() : '')
  const [visibleTiers, setVisibleTiers] = useState(course.visible_tiers?.length ? course.visible_tiers : TIERS)
  const [listingType, setListingType] = useState(course.listing_type || 'membership')
  const [thumbnail, setThumbnail] = useState(null)
  const [error, setError] = useState('')

  const currentThumb = courseThumbnailUrl(course.thumbnail_path)

  // Dirty tracking (tasks #3/#4): a plain snapshot-and-compare rather than a
  // dirty flag toggled by every individual onChange — one place to keep in
  // sync as fields are added, instead of twenty. Every string field is
  // normalized the same way doSave normalizes it before persisting (trimmed;
  // slug additionally run through slugify) — comparing raw, un-trimmed input
  // state against the trimmed values that actually got saved would otherwise
  // leave `dirty` stuck true forever after a save whenever a field has
  // incidental leading/trailing whitespace or an un-normalized slug.
  // baselineRef starts as exactly those values, derived from `course` (this
  // panel mounts fresh whenever the admin returns to the Details tab, so
  // "fresh from `course`" is always the right starting baseline), and is
  // advanced to the just-saved values after every successful save, so the
  // very next render already reads as clean again.
  function buildSnapshot() {
    return {
      title: title.trim(),
      description: description.trim(),
      categoryId: categoryId || '',
      slug: slugify(slug || title) || '',
      shortDescription: shortDescription.trim(),
      status,
      isSpecialProgram,
      accessMode,
      weeks,
      level: level.trim(),
      language: language.trim(),
      learningOutcomes: learningOutcomes.trim(),
      prerequisites: prerequisites.trim(),
      featured,
      price,
      visibleTiers,
      listingType,
      hasThumbnail: !!thumbnail,
    }
  }
  const baselineRef = useRef({
    title: (course.title || '').trim(),
    description: (course.description || '').trim(),
    categoryId: course.category_id || '',
    slug: slugify(course.slug || course.title || '') || '',
    shortDescription: (course.short_description || '').trim(),
    status: course.status || 'published',
    isSpecialProgram: !!course.is_special_program,
    accessMode: course.access_mode || 'open',
    weeks: course.weeks != null ? String(course.weeks) : '',
    level: (course.level || '').trim(),
    language: (course.language || '').trim(),
    learningOutcomes: (course.learning_outcomes || '').trim(),
    prerequisites: (course.prerequisites || '').trim(),
    featured: !!course.featured,
    price: course.price_cents ? (course.price_cents / 100).toString() : '',
    visibleTiers: course.visible_tiers?.length ? course.visible_tiers : TIERS,
    listingType: course.listing_type || 'membership',
    hasThumbnail: false,
  })
  const dirty = JSON.stringify(buildSnapshot()) !== JSON.stringify(baselineRef.current)
  useEffect(() => {
    onDirtyChange?.(dirty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty])
  // Tell the parent this instance is gone (rather than just quietly dirty=false)
  // when the admin navigates off the Details tab entirely, so ManageCourse
  // never keeps stale dirty/last-saved state around for a panel that no
  // longer exists.
  useEffect(() => () => onDirtyChange?.(false), []) // eslint-disable-line react-hooks/exhaustive-deps

  // Powers the read-only "Duration & episodes" summary — fetched once on
  // mount (this panel remounts fresh whenever the admin switches back to the
  // Details tab, so it never goes stale against edits made in Episodes).
  useEffect(() => {
    let cancelled = false
    fetchCourseLessonsStats(course.id)
      .then((stats) => { if (!cancelled) setLessonsStats(stats) })
      .catch(() => { if (!cancelled) setLessonsStats([]) })
    return () => {
      cancelled = true
    }
  }, [course.id])

  useEffect(() => {
    let cancelled = false
    listCategories()
      .then((list) => { if (!cancelled) setCategories(list) })
      .catch((err) => setCategoryError(err.message || 'Could not load categories.'))
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-derives the slug from the title until the admin edits the slug
  // field directly — the moment they do, handleSlugChange flips slugTouched
  // and this stops overwriting whatever they typed.
  function handleTitleChange(e) {
    const value = e.target.value
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function handleSlugChange(e) {
    setSlugTouched(true)
    setSlug(e.target.value)
  }

  function toggleTier(tier) {
    setVisibleTiers((prev) => (prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]))
  }

  function handleCategorySelect(e) {
    const value = e.target.value
    if (value === ADD_NEW_CATEGORY) {
      setCategoryError('')
      setAddingCategory(true)
      return
    }
    setAddingCategory(false)
    setCategoryId(value)
  }

  async function handleCreateCategory() {
    setCategoryError('')
    if (!newCategoryName.trim()) return
    try {
      const created = await createCategory(newCategoryName)
      setCategories((prev) => [...prev, created])
      setCategoryId(created.id)
      setNewCategoryName('')
      setAddingCategory(false)
    } catch (err) {
      setCategoryError(err.message || 'Could not create this category.')
    }
  }

  // The actual save logic, callable both from this form's own onSubmit (Enter
  // key) and imperatively via the ref (ManageCourse's sticky Save/Save as
  // draft/Publish bar, plus its autosave timer) — see the design note above
  // the component. `statusOverride` is only ever passed by "Save as draft" /
  // "Publish"; a plain "Save" (or autosave) leaves the course's own status
  // field untouched. Returns true on a successful save, false otherwise, so
  // callers can decide whether to update a "Last saved" timestamp.
  async function doSave(statusOverride) {
    setError('')
    setSlugError('')
    if (!title.trim()) {
      setError('Enter a title.')
      return false
    }
    if (visibleTiers.length === 0) {
      setError('Select at least one tier.')
      return false
    }

    const finalSlug = slugify(slug || title)
    if (!finalSlug) {
      setError('Enter a slug (or a title to derive one from).')
      return false
    }

    const nextStatus = statusOverride || status
    const weeksValue = weeks.trim() ? parseInt(weeks, 10) : null
    const weeksDecreasing = weeksValue != null && course.weeks != null && weeksValue < course.weeks

    try {
      // Uniqueness pre-check (task #1): the DB's partial unique index
      // (courses_slug_unique_idx, migration 0021) is a real backstop, but a
      // raw Postgres unique-violation isn't a message an admin should have
      // to decode — check for a live collision ourselves first.
      const slugTaken = await isCourseSlugTaken(finalSlug, course.id)
      // Guard (task #6): only ever checked on a genuine decrease — leaving
      // weeks unset or increasing it never needs to look at course_lessons.
      const weeksBlockError = weeksDecreasing
        ? findWeeksDecreaseError(await fetchCourseLessonsStats(course.id), weeksValue)
        : null

      if (slugTaken) {
        setSlugError(`The slug "${finalSlug}" is already used by another course. Choose a different one.`)
        return false
      }
      if (weeksBlockError) {
        setError(weeksBlockError)
        return false
      }

      // Write-through: the selected category's NAME also goes into the
      // legacy free-text `category` column (0014) alongside the new
      // `categoryId` FK, so CourseLibrary.jsx / Programs.jsx and anywhere
      // else that still reads courses.category keep working unchanged. Falls
      // back to the course's existing text if the dropdown selection wasn't
      // touched and hasn't finished loading yet / no longer matches a known
      // category, so an unrelated save never blanks it out.
      const selectedCategory = categories.find((c) => c.id === categoryId)
      const categoryName = selectedCategory
        ? selectedCategory.name
        : categoryId && categoryId === course.category_id
          ? course.category || ''
          : ''
      const fields = {
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || null,
        category: categoryName,
        featured,
        priceCents: Math.round(parseFloat(price || '0') * 100) || 0,
        visibleTiers,
        listingType,
        slug: finalSlug,
        shortDescription: shortDescription.trim(),
        isSpecialProgram,
        status: nextStatus,
        accessMode,
        weeks: weeksValue,
        level: level.trim(),
        language: language.trim(),
        learningOutcomes: learningOutcomes.trim(),
        prerequisites: prerequisites.trim(),
      }
      if (thumbnail) {
        const uploaded = await uploadCourseThumbnail(thumbnail)
        fields.thumbnailPath = uploaded.path
      }
      await updateCourse(course.id, fields)
      setThumbnail(null)
      if (statusOverride) setStatus(statusOverride)
      // Move the dirty-check baseline forward to exactly what was just
      // written, so `dirty` reads false again the instant this resolves.
      // Reuses buildSnapshot() for every field it already normalizes the
      // same way `fields` above does; `status` is overridden explicitly
      // because setStatus() above hasn't re-rendered yet, so buildSnapshot()
      // would otherwise still read the pre-save `status` closure value.
      baselineRef.current = { ...buildSnapshot(), status: nextStatus, hasThumbnail: false }
      onSaved?.()
      return true
    } catch (err) {
      setError(err.message || 'Could not save the course.')
      return false
    }
  }

  // No deps array: intentionally rebuilt every render so `save` always
  // closes over the latest field values (this form has ~20 of them — not
  // worth a matching ~20-entry dependency list just to memoize a plain
  // function object).
  useImperativeHandle(ref, () => ({ save: doSave }))

  async function handleFormSubmit(e) {
    e.preventDefault()
    await doSave()
  }

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
      <div>
        <label className={labelCls}>Title</label>
        <input type="text" value={title} onChange={handleTitleChange} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Slug</label>
        <input type="text" value={slug} onChange={handleSlugChange} placeholder="inherit-your-freedom" className={inputCls} />
        <p className="mt-1.5 font-serif text-[12px] text-cream/40">Auto-generated from the title until you edit it directly.</p>
        {slugError && <p className="mt-1.5 font-serif text-[12px] text-[#D8888A]">{slugError}</p>}
      </div>
      <div>
        <label className={labelCls}>Description (optional)</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Short description (optional)</label>
        <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="A one-line hook for cards and previews" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Category</label>
          <select
            value={addingCategory ? ADD_NEW_CATEGORY : categoryId}
            onChange={handleCategorySelect}
            style={{ colorScheme: 'dark' }}
            className={inputCls}
          >
            <option value="">— No category —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
            <option value={ADD_NEW_CATEGORY}>+ Add new category…</option>
          </select>
          {addingCategory && (
            <div className="mt-2.5 flex items-center gap-2.5">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="flex-1 rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[10px] font-serif text-[13.5px] text-cream outline-none"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="cursor-pointer whitespace-nowrap rounded-full bg-gold px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setAddingCategory(false); setNewCategoryName(''); setCategoryId(course.category_id || '') }}
                className="cursor-pointer whitespace-nowrap border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/50"
              >
                Cancel
              </button>
            </div>
          )}
          {categoryError && <p className="mt-1.5 font-serif text-[12px] text-[#D8888A]">{categoryError}</p>}
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <div className="flex flex-wrap gap-2.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={toggleBtnCls}
                style={status === s ? toggleOnStyle : toggleOffStyle}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Course type</label>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setIsSpecialProgram(false)}
            className={toggleBtnCls}
            style={!isSpecialProgram ? toggleOnStyle : toggleOffStyle}
          >
            Regular course
          </button>
          <button
            type="button"
            onClick={() => setIsSpecialProgram(true)}
            className={toggleBtnCls}
            style={isSpecialProgram ? toggleOnStyle : toggleOffStyle}
          >
            Special Program
          </button>
        </div>
      </div>

      <div>
        <label className={labelCls}>Access mode</label>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setAccessMode('open')}
            className={toggleBtnCls}
            style={accessMode === 'open' ? toggleOnStyle : toggleOffStyle}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => setAccessMode('sequential')}
            className={toggleBtnCls}
            style={accessMode === 'sequential' ? toggleOnStyle : toggleOffStyle}
          >
            Sequential
          </button>
        </div>
        <p className="mt-1.5 font-serif text-[12px] text-cream/40">
          Open lets a member watch any released episode in any order. Sequential requires each episode to be completed before the next unlocks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Weeks (optional)</label>
          <input type="number" min="1" step="1" value={weeks} onChange={(e) => setWeeks(e.target.value)} placeholder="12" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Duration & episodes</label>
          <p className="flex h-[47px] items-center font-serif text-[15px] text-cream/70">
            {lessonsStats === null ? 'Loading…' : formatLessonsSummary(lessonsStats, weeks.trim() ? parseInt(weeks, 10) : null)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Level (optional)</label>
          <input type="text" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Beginner, Intermediate, Advanced…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Language (optional)</label>
          <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="English" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Learning outcomes (optional)</label>
        <textarea value={learningOutcomes} onChange={(e) => setLearningOutcomes(e.target.value)} rows={3} className={`${inputCls} resize-y`} />
      </div>

      <div>
        <label className={labelCls}>Prerequisites (optional)</label>
        <textarea value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} rows={3} className={`${inputCls} resize-y`} />
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2.5 font-serif text-[13.5px] text-cream/70">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Feature this course in the library's hero banner
      </label>

      <div>
        <label className={labelCls}>Standalone price (USD — 0 for membership-only)</label>
        <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="497.00" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Listing (Membership vs Courses catalog)</label>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={() => setListingType('membership')} className={toggleBtnCls} style={listingType === 'membership' ? toggleOnStyle : toggleOffStyle}>
            Membership
          </button>
          <button type="button" onClick={() => setListingType('course')} className={toggleBtnCls} style={listingType === 'course' ? toggleOnStyle : toggleOffStyle}>
            Course
          </button>
        </div>
        <p className="mt-1.5 font-serif text-[12px] text-cream/40">
          Display/filter only — doesn't change who can watch. "Course" also lists it on the public standalone-purchase catalog.
        </p>
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
        <label className={labelCls}>Course thumbnail / cover image</label>
        <div className="flex items-center gap-4">
          {currentThumb && <img src={currentThumb} alt="" className="h-14 w-24 rounded-md object-cover" />}
          <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} className="font-serif text-[13.5px] text-cream/70" />
        </div>
        <p className="mt-1.5 font-serif text-[12px] text-cream/40">Leave empty to keep the current image.</p>
      </div>

      {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
      {/* No submit button here anymore — ManageCourse's sticky Save / Save as
          draft / Publish bar is the only way to save this tab now (see the
          design note above). Pressing Enter in a field still submits this
          form via handleFormSubmit, same as a plain "Save" from that bar. */}
    </form>
  )
})

export default CourseDetailsPanel
