import { supabase } from './supabaseClient'

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
  durationLabel,
  featured,
  visibleTiers,
  thumbnailPath,
  videoUrl,
}) {
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('courses').insert({
    title,
    description: description || null,
    category: category || null,
    duration_label: durationLabel || null,
    featured: !!featured,
    visible_tiers: visibleTiers,
    thumbnail_path: thumbnailPath || null,
    video_url: videoUrl,
    created_by: userData.user?.id ?? null,
  })
  if (error) throw error
}

// Deliberately excludes video_url: browsing is open to every member (see
// migration 0011's courses SELECT policy), but the actual video is only
// ever fetched through get_course_video_url() once the member's tier +
// active membership are confirmed (see billing.js's fetchCourseVideoUrl,
// migration 0013) — selecting it here would leak locked content straight
// past that gate.
export async function listCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, category, duration_label, featured, visible_tiers, thumbnail_path, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
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
  return data
}

export async function deleteCourse(id, thumbnailPath) {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
  if (thumbnailPath) {
    await supabase.storage.from('course-thumbnails').remove([thumbnailPath])
  }
}
