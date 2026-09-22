// Core write path for the progress-tracking module. Called every ~10s while
// an episode plays, plus immediately on pause/seeked/ended/tab-hide/episode
// switch (see src/lib/progress.js). Idempotent/monotonic upsert into
// lesson_progress (migration 0037/0038), then an in-transaction-equivalent
// rollup refresh of course_progress -- there's no background job queue in
// this codebase, so keeping the rollup in sync here (cheap: one extra
// select + upsert) is simpler and more consistent than a queued job for
// every heartbeat; the admin recompute job (progress-recompute, separate)
// exists for bulk repair after episode add/remove/reorder, not for this.
//
// Auth: a normal member's JWT identifies the caller; every actual read/write
// goes through the service-role client, same two-client split as
// create-checkout-session/get-billing-summary.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// All thresholds in one place, per the spec -- duplicated (not imported)
// into progress-complete/progress-course since this codebase has no shared
// module directory for Edge Functions; keep these three files' copies in
// sync if a threshold ever changes.
const HEARTBEAT_INTERVAL_SECONDS = 10
const STALE_CLIENT_TS_SECONDS = 60
const COMPLETION_MAX_POSITION_FRACTION = 0.9
const COMPLETION_SECONDS_WATCHED_FRACTION = 0.5
const SHORT_VIDEO_SECONDS = 30
const MAX_WATCHED_DELTA_SECONDS = HEARTBEAT_INTERVAL_SECONDS * 2

async function recomputeCourseProgress(adminClient: ReturnType<typeof createClient>, userId: string, courseId: string) {
  const { data: lessons } = await adminClient.from('course_lessons').select('id').eq('course_id', courseId)
  const lessonIds = (lessons || []).map((l: { id: string }) => l.id)
  const totalEpisodes = lessonIds.length

  let completedEpisodes = 0
  let totalSecondsWatched = 0
  // Fractional credit per episode -- 1 for a completed one, else its own
  // max_position/duration fraction (lesson_progress.percent, already
  // computed and capped at 1 by the heartbeat upsert below). Course percent
  // is the average of this across every episode, not just completed-count,
  // so watching 30s of episode 1 moves the course bar immediately instead
  // of sitting at 0% until a whole episode is finished.
  let fractionalCreditSum = 0
  let lastEpisodeId: string | null = null
  let lastWatchedAt: string | null = null
  let startedAt: string | null = null

  if (lessonIds.length > 0) {
    const { data: rows } = await adminClient
      .from('lesson_progress')
      .select('lesson_id, completed, percent, seconds_watched, updated_at, first_watched_at')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)
    for (const r of rows || []) {
      if (r.completed) completedEpisodes += 1
      fractionalCreditSum += r.completed ? 1 : Math.min(1, Number(r.percent) || 0)
      totalSecondsWatched += Number(r.seconds_watched) || 0
      if (!lastWatchedAt || new Date(r.updated_at) > new Date(lastWatchedAt)) {
        lastWatchedAt = r.updated_at
        lastEpisodeId = r.lesson_id
      }
      if (r.first_watched_at && (!startedAt || new Date(r.first_watched_at) < new Date(startedAt))) {
        startedAt = r.first_watched_at
      }
    }
  }

  const percent = totalEpisodes > 0 ? Math.round((fractionalCreditSum / totalEpisodes) * 100) : 0

  // Preserve a course's completed_at/started_at once set -- e.g. adding a
  // new episode later can drop percent back under 100, but "the member
  // finished the course on this date" stays a true historical fact.
  const { data: existingRollup } = await adminClient
    .from('course_progress')
    .select('started_at, completed_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  const finalCompletedAt =
    existingRollup?.completed_at || (totalEpisodes > 0 && completedEpisodes === totalEpisodes ? new Date().toISOString() : null)

  await adminClient.from('course_progress').upsert(
    {
      user_id: userId,
      course_id: courseId,
      total_episodes: totalEpisodes,
      completed_episodes: completedEpisodes,
      percent,
      total_seconds_watched: totalSecondsWatched,
      last_episode_id: lastEpisodeId,
      last_watched_at: lastWatchedAt,
      started_at: existingRollup?.started_at || startedAt,
      completed_at: finalCompletedAt,
    },
    { onConflict: 'user_id,course_id' }
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const adminClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Not authenticated' }, 401)
    const user = userData.user

    const body = await req.json().catch(() => ({}))
    const episodeId = body.episodeId
    if (!episodeId) return json({ error: 'episodeId is required' }, 400)

    const { data: lesson } = await adminClient
      .from('course_lessons')
      .select('id, course_id, duration_seconds')
      .eq('id', episodeId)
      .maybeSingle()
    if (!lesson) return json({ error: 'Episode not found' }, 404)

    const { data: access, error: accessError } = await adminClient.rpc('can_play_episode', {
      p_user_id: user.id,
      p_lesson_id: episodeId,
    })
    if (accessError) throw accessError
    const decision = Array.isArray(access) ? access[0] : access
    if (!decision?.allowed) return json({ error: 'Not allowed', reason: decision?.reason || 'not_entitled' }, 403)

    const { data: existing } = await adminClient
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', episodeId)
      .maybeSingle()

    // Idempotency/ordering guard: drop a heartbeat whose client clock claims
    // to be more than 60s older than the last write we already have -- a
    // late-arriving retry from a flaky connection shouldn't rewind state a
    // newer heartbeat already advanced.
    if (existing && body.clientTs) {
      const clientTime = new Date(body.clientTs).getTime()
      const storedTime = new Date(existing.updated_at).getTime()
      if (!Number.isNaN(clientTime) && clientTime < storedTime - STALE_CLIENT_TS_SECONDS * 1000) {
        return new Response(null, { status: 204, headers: corsHeaders })
      }
    }

    const effectiveDuration = Number(body.duration) || Number(existing?.duration) || Number(lesson.duration_seconds) || 0
    const safePosition = Math.max(0, Number(body.position) || 0)
    const newMaxPosition = Math.max(Number(existing?.max_position_seconds) || 0, safePosition, Number(body.maxPosition) || 0)
    const cappedDelta = Math.max(0, Math.min(Number(body.secondsWatchedDelta) || 0, MAX_WATCHED_DELTA_SECONDS))
    const newSecondsWatched = (Number(existing?.seconds_watched) || 0) + cappedDelta

    let completed = existing?.completed || false
    let completedAt = existing?.completed_at || null
    let lastPosition = safePosition

    // Completion safety net -- catches "closed at 99%, ended never fired"
    // (item #14) even though the client also calls progress-complete
    // directly on a real `ended` event.
    if (!completed && effectiveDuration > 0 && effectiveDuration >= SHORT_VIDEO_SECONDS) {
      const positionThresholdMet = newMaxPosition >= effectiveDuration * COMPLETION_MAX_POSITION_FRACTION
      const watchedThresholdMet = newSecondsWatched >= effectiveDuration * COMPLETION_SECONDS_WATCHED_FRACTION
      if (positionThresholdMet && watchedThresholdMet) {
        completed = true
        completedAt = new Date().toISOString()
        lastPosition = 0
      }
    }

    const patch = {
      user_id: user.id,
      lesson_id: episodeId,
      course_id: lesson.course_id,
      seconds: lastPosition,
      duration: effectiveDuration || null,
      percent: effectiveDuration > 0 ? Math.min(1, newMaxPosition / effectiveDuration) : Number(existing?.percent) || 0,
      completed,
      completed_at: completedAt,
      completed_manually: existing?.completed_manually || false,
      max_position_seconds: newMaxPosition,
      seconds_watched: newSecondsWatched,
      vimeo_id: body.vimeoId || existing?.vimeo_id || null,
      playback_rate: body.playbackRate || existing?.playback_rate || null,
      first_watched_at: existing?.first_watched_at || new Date().toISOString(),
      started_over_at: existing?.started_over_at || null,
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await adminClient.from('lesson_progress').upsert(patch, { onConflict: 'user_id,lesson_id' })
    if (upsertError) throw upsertError

    // Optional write-back (constraint: only when empty) -- lets the admin's
    // duration column self-heal from the player's own getDuration() even if
    // an oEmbed/API lookup never ran or failed.
    if (body.duration && !lesson.duration_seconds) {
      await adminClient.from('course_lessons').update({ duration_seconds: Math.round(Number(body.duration)) }).eq('id', episodeId)
    }

    await recomputeCourseProgress(adminClient, user.id, lesson.course_id)

    return new Response(null, { status: 204, headers: corsHeaders })
  } catch (err) {
    console.error('progress-heartbeat error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
