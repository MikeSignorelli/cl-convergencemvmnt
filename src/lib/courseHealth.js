import { supabase } from './supabaseClient'

// Unresolved course_health_flags (migration 0029), joined to their lesson +
// course for display — powers the admin course list's health banner
// (UploadCourses.jsx). Only unresolved flags are ever fetched: the
// course-health-check Edge Function deletes-and-reinserts the whole
// unresolved set on every run, so this always reflects the latest run.
export async function fetchUnresolvedCourseHealthFlags() {
  const { data, error } = await supabase
    .from('course_health_flags')
    .select('id, flag_type, detected_at, lesson_id, course_id, course_lessons(title), courses(title)')
    .is('resolved_at', null)
    .order('detected_at', { ascending: false })
  if (error) throw error
  return (data || []).map((f) => ({
    id: f.id,
    flagType: f.flag_type,
    detectedAt: f.detected_at,
    lessonId: f.lesson_id,
    courseId: f.course_id,
    lessonTitle: f.course_lessons?.title || 'Untitled episode',
    courseTitle: f.courses?.title || 'Untitled course',
  }))
}

// Manually triggers the course-health-check Edge Function for an on-demand
// run (the course list's "Check Vimeo links now" button) instead of waiting
// for the external schedule. Runs with the caller's own session — the
// function accepts a valid admin JWT as an alternative to its cron shared
// secret specifically so this on-demand path never needs that secret
// exposed to the browser (see the function's top-of-file comment).
export async function runCourseHealthCheck({ dryRun = false, daysAhead } = {}) {
  const { data, error } = await supabase.functions.invoke('course-health-check', {
    body: { dryRun, ...(daysAhead ? { daysAhead } : {}) },
  })
  if (error) throw error
  return data
}
