import { supabase } from './supabaseClient'
import { courseThumbnailUrl } from './courses'

function decorate(rows) {
  const now = Date.now()
  return (rows || []).map((l) => ({
    ...l,
    // l.thumbnail_url (only present on rows selected via admin_list_lessons,
    // 0025) is the raw Vimeo-oEmbed thumbnail stored on course_lessons
    // (0021) -- keep it under its own key before the next line overwrites
    // `thumbnail_url` with the resolved DISPLAY url every existing consumer
    // (CourseDetail.jsx, EpisodesPanel.jsx) already expects there: an
    // uploaded Storage thumbnail when present, else that same Vimeo
    // fallback.
    vimeo_thumbnail_url: l.thumbnail_url ?? null,
    thumbnail_url: courseThumbnailUrl(l.thumbnail_path) || l.thumbnail_url || null,
    // With fixed release dates: released if no date, or the date has passed.
    released: !l.release_at || new Date(l.release_at).getTime() <= now,
    // Upcoming/overdue badges (EpisodesPanel): release_at in the future is
    // "Upcoming". video_url is NOT NULL on this table (0017), so a bad/
    // unparseable Vimeo link still saves a (broken) video_url -- vimeo_id
    // being null is the practical signal that the saved link couldn't
    // actually be resolved, which is what "Overdue -- no video" checks for.
    is_upcoming: !!l.release_at && new Date(l.release_at).getTime() > now,
    is_overdue_no_video: !!l.release_at && new Date(l.release_at).getTime() <= now && !l.vimeo_id,
  }))
}

// Member/public episode list — NO video_url (it's revoked at the DB and served
// only through get_lesson_video_url after the access + drip check).
export async function listCourseLessons(courseId) {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('id, course_id, title, description, extra_info, thumbnail_path, duration_label, release_at, week_number, is_open_access, position, created_at')
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
  weekNumber,
  position,
  vimeoId,
  durationSeconds,
  durationSource,
  thumbnailUrl,
  isOpenAccess,
}) {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id ?? null
  const { error } = await supabase.from('course_lessons').insert({
    course_id: courseId,
    title,
    description: description || null,
    extra_info: extraInfo || null,
    video_url: videoUrl,
    thumbnail_path: thumbnailPath || null,
    duration_label: durationLabel || null,
    release_at: releaseAt || null,
    week_number: weekNumber || null,
    position: position ?? 0,
    vimeo_id: vimeoId || null,
    duration_seconds: durationSeconds ?? null,
    duration_source: durationSource || null,
    thumbnail_url: thumbnailUrl || null,
    is_open_access: !!isOpenAccess,
    created_by: uid,
    updated_by: uid,
  })
  if (error) throw error
}

// Edit an existing episode. Only the fields passed change — omit thumbnailPath
// to keep the current thumbnail. Always stamps updated_by with the current
// admin (task #10) — every caller gets this for free, same as createLesson
// already stamps created_by.
export async function updateLesson(id, fields) {
  const { data: userData } = await supabase.auth.getUser()
  const patch = { updated_by: userData.user?.id ?? null }
  if ('title' in fields) patch.title = fields.title
  if ('description' in fields) patch.description = fields.description || null
  if ('extraInfo' in fields) patch.extra_info = fields.extraInfo || null
  if ('videoUrl' in fields) patch.video_url = fields.videoUrl
  if ('thumbnailPath' in fields) patch.thumbnail_path = fields.thumbnailPath || null
  if ('durationLabel' in fields) patch.duration_label = fields.durationLabel || null
  if ('releaseAt' in fields) patch.release_at = fields.releaseAt || null
  if ('weekNumber' in fields) patch.week_number = fields.weekNumber || null
  if ('position' in fields) patch.position = fields.position
  if ('vimeoId' in fields) patch.vimeo_id = fields.vimeoId || null
  if ('durationSeconds' in fields) patch.duration_seconds = fields.durationSeconds ?? null
  if ('durationSource' in fields) patch.duration_source = fields.durationSource || null
  if ('thumbnailUrl' in fields) patch.thumbnail_url = fields.thumbnailUrl || null
  if ('isOpenAccess' in fields) patch.is_open_access = !!fields.isOpenAccess
  const { error } = await supabase.from('course_lessons').update(patch).eq('id', id)
  if (error) throw error
}

// Swap the order of two episodes (reorder up/down).
export async function swapLessonPositions(a, b) {
  await updateLesson(a.id, { position: b.position })
  await updateLesson(b.id, { position: a.position })
}

// Copies an existing (decorated, i.e. from adminListLessons) episode as a new
// row — every field except id/created_at, title suffixed " (copy)" — at the
// given position. created_by/updated_by are re-stamped fresh by createLesson
// rather than copied, since this is a genuinely new row.
export async function duplicateLesson(lesson, position) {
  await createLesson({
    courseId: lesson.course_id,
    title: `${lesson.title} (copy)`,
    description: lesson.description,
    extraInfo: lesson.extra_info,
    videoUrl: lesson.video_url,
    thumbnailPath: lesson.thumbnail_path,
    durationLabel: lesson.duration_label,
    releaseAt: lesson.release_at,
    weekNumber: lesson.week_number,
    position,
    vimeoId: lesson.vimeo_id,
    durationSeconds: lesson.duration_seconds,
    durationSource: lesson.duration_source,
    thumbnailUrl: lesson.vimeo_thumbnail_url,
    isOpenAccess: lesson.is_open_access,
  })
}

export async function deleteLesson(id, thumbnailPath) {
  const { error } = await supabase.from('course_lessons').delete().eq('id', id)
  if (error) throw error
  if (thumbnailPath) {
    await supabase.storage.from('course-thumbnails').remove([thumbnailPath])
  }
}

// ---- Watch progress (lesson_progress) --------------------------------------

export async function saveLessonProgress({ lessonId, courseId, seconds, duration, percent, completed }) {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return
  await supabase.from('lesson_progress').upsert(
    {
      user_id: uid,
      lesson_id: lessonId,
      course_id: courseId,
      seconds: Math.round(seconds || 0),
      duration: duration ? Math.round(duration) : null,
      percent: percent || 0,
      completed: completed || false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' }
  )
}

// All of the caller's progress rows for one course, keyed by lesson_id — powers
// the per-episode DONE / in-progress state, the course progress bar, and (via
// CourseDetail.jsx's isSequentiallyLocked) the access_mode 'sequential'
// lock-reason UI. RLS scopes this to the caller's own rows.
export async function fetchCourseProgress(courseId) {
  const { data } = await supabase
    .from('lesson_progress')
    .select('lesson_id, percent, seconds, completed')
    .eq('course_id', courseId)
  const map = {}
  for (const r of data || []) map[r.lesson_id] = r
  return map
}

export async function fetchLessonProgress(lessonId) {
  const { data } = await supabase
    .from('lesson_progress')
    .select('seconds, percent, completed')
    .eq('lesson_id', lessonId)
    .maybeSingle()
  return data
}

// Most-recently-watched, not-yet-finished episode — powers the dashboard card.
export async function fetchContinueWatching() {
  const { data } = await supabase
    .from('lesson_progress')
    .select('lesson_id, course_id, seconds, duration, percent, updated_at, course_lessons(title), courses(title, thumbnail_path)')
    .eq('completed', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return {
    courseId: data.course_id,
    lessonId: data.lesson_id,
    percent: Math.round(data.percent || 0),
    seconds: data.seconds,
    duration: data.duration,
    courseTitle: data.courses?.title,
    episodeTitle: data.course_lessons?.title,
    thumbnailUrl: courseThumbnailUrl(data.courses?.thumbnail_path),
  }
}
