import { supabase } from './supabaseClient'
import { courseThumbnailUrl } from './courses'

function decorate(rows) {
  const now = Date.now()
  return (rows || []).map((l) => ({
    ...l,
    thumbnail_url: courseThumbnailUrl(l.thumbnail_path),
    // With fixed release dates: released if no date, or the date has passed.
    released: !l.release_at || new Date(l.release_at).getTime() <= now,
  }))
}

// Member/public episode list — NO video_url (it's revoked at the DB and served
// only through get_lesson_video_url after the access + drip check).
export async function listCourseLessons(courseId) {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('id, course_id, title, description, extra_info, thumbnail_path, duration_label, release_at, position, created_at')
    .eq('course_id', courseId)
    .order('position', { ascending: true })
  if (error) throw error
  return decorate(data)
}

// Gated + drip-aware video URL for one episode. Returns null if the caller
// can't access it (no membership/purchase) or it hasn't been released yet.
export async function fetchLessonVideoUrl(lessonId) {
  const { data, error } = await supabase.rpc('get_lesson_video_url', { p_lesson_id: lessonId })
  if (error) throw error
  return data
}

// Admin: full episode list incl. video_url + release date.
export async function adminListLessons(courseId) {
  const { data, error } = await supabase.rpc('admin_list_lessons', { p_course_id: courseId })
  if (error) throw error
  return decorate(data)
}

export async function createLesson({
  courseId,
  title,
  description,
  extraInfo,
  videoUrl,
  thumbnailPath,
  durationLabel,
  releaseAt,
  position,
}) {
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('course_lessons').insert({
    course_id: courseId,
    title,
    description: description || null,
    extra_info: extraInfo || null,
    video_url: videoUrl,
    thumbnail_path: thumbnailPath || null,
    duration_label: durationLabel || null,
    release_at: releaseAt || null,
    position: position ?? 0,
    created_by: userData.user?.id ?? null,
  })
  if (error) throw error
}

export async function deleteLesson(id, thumbnailPath) {
  const { error } = await supabase.from('course_lessons').delete().eq('id', id)
  if (error) throw error
  if (thumbnailPath) {
    await supabase.storage.from('course-thumbnails').remove([thumbnailPath])
  }
}
