import { supabase } from './supabaseClient'

// Thumbnails are stored as a storage PATH (see uploadCourseThumbnail), not a
// URL — resolve to the public URL for display. Tolerates legacy rows that may
// already hold a full URL, and returns null when there's no thumbnail.
export function courseThumbnailUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const { data } = supabase.storage.from('course-thumbnails').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadCourseThumbnail(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('course-thumbnails')
    .upload(path, file, { contentType: file.type })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('course-thumbnails').getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

export async function createCourse({
  title,
  description,
  category,
  categoryId,
  durationLabel,
  featured,
  priceCents,
  stripePriceId,
  visibleTiers,
  thumbnailPath,
  videoUrl,
}) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('courses').insert({
    title,
    description: description || null,
    category: category || null,
    category_id: categoryId || null,
    duration_label: durationLabel || null,
    featured: !!featured,
    price_cents: priceCents || 0,
    stripe_price_id: stripePriceId || null,
    visible_tiers: visibleTiers,
    thumbnail_path: thumbnailPath || null,
    video_url: videoUrl || null,
    created_by: userData.user?.id ?? null,
  }).select('id').single()
  if (error) throw error
  return data // { id } — lets the caller seed a first episode right away
}

// Edit an existing course. Only the fields passed are changed — omit
// thumbnailPath to keep the current thumbnail (pass it only on a new upload).
export async function updateCourse(id, fields) {
  const patch = {}
  if ('title' in fields) patch.title = fields.title
  if ('description' in fields) patch.description = fields.description || null
  if ('category' in fields) patch.category = fields.category || null
  if ('categoryId' in fields) patch.category_id = fields.categoryId || null
  if ('durationLabel' in fields) patch.duration_label = fields.durationLabel || null
  if ('featured' in fields) patch.featured = !!fields.featured
  if ('priceCents' in fields) patch.price_cents = fields.priceCents || 0
  if ('stripePriceId' in fields) patch.stripe_price_id = fields.stripePriceId || null
  if ('visibleTiers' in fields) patch.visible_tiers = fields.visibleTiers
  if ('thumbnailPath' in fields) patch.thumbnail_path = fields.thumbnailPath || null
  const { error } = await supabase.from('courses').update(patch).eq('id', id)
  if (error) throw error
}

// Deliberately excludes video_url: browsing is open to everyone, including
// anon (see migration 0015's courses SELECT policy — needed for the public
// /programs catalog), but the actual video is only ever fetched through
// get_course_video_url() once membership or a standalone purchase confirms
// access (see billing.js's fetchCourseVideoUrl) — selecting it here would
// leak locked content straight past that gate. price_cents is included so
// both the member Course Library and the public standalone-purchase catalog
// can share this one query.
export async function listCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, category, duration_label, featured, price_cents, visible_tiers, thumbnail_path, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((c) => ({ ...c, thumbnail_url: courseThumbnailUrl(c.thumbnail_path) }))
}

// The public "Courses & Mentorship" catalog only shows courses an admin has
// actually priced for standalone purchase (price_cents > 0) — the rest stay
// membership-only, visible in the member Course Library but not sold here.
export async function listStandaloneCourses() {
  const courses = await listCourses()
  return courses.filter((c) => c.price_cents > 0)
}

// Admin-only view (video_url included) — see admin_list_courses() in
// migration 0011 for why this needs its own RPC rather than listCourses().
export async function adminListCourses() {
  const { data, error } = await supabase.rpc('admin_list_courses')
  if (error) throw error
  return data || []
}

export async function fetchCourse(id) {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, category, duration_label, visible_tiers, thumbnail_path, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? { ...data, thumbnail_url: courseThumbnailUrl(data.thumbnail_path) } : data
}

export async function deleteCourse(id, thumbnailPath) {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
  if (thumbnailPath) {
    await supabase.storage.from('course-thumbnails').remove([thumbnailPath])
  }
}
