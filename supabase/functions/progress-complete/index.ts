// POST: mark an episode complete (manual "Mark complete", or the client's
// own `ended`-event call — same endpoint either way). DELETE: mark it
// incomplete again (item #17 — an explicit, allowed reversal; distinct from
// "start over", which never touches completion).
//
// Manual completion is blocked on sequential-access courses (an admin can
// still do it, previewing/managing content) -- letting a member skip ahead
// by hand-marking an unwatched episode complete would defeat the sequential
// gate can_play_episode enforces for every other episode.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function recomputeCourseProgress(adminClient: ReturnType<typeof createClient>, userId: string, courseId: string) {
  const { data: lessons } = await adminClient.from('course_lessons').select('id').eq('course_id', courseId)
  const lessonIds = (lessons || []).map((l: { id: string }) => l.id)
  const totalEpisodes = lessonIds.length

  let completedEpisodes = 0
  let totalSecondsWatched = 0
  // Fractional credit per episode -- 1 for a completed one, else its own
  // max_position/duration fraction (lesson_progress.percent). Course percent
  // is the average of this across every episode, not just completed-count,
  // so watching part of an episode moves the course bar immediately instead
  // of sitting at 0% until a whole episode is finished. Kept identical to
  // progress-heartbeat's copy of this function.
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
    const markComplete = req.method !== 'DELETE'

    const { data: lesson } = await adminClient
      .from('course_lessons')
      .select('id, course_id')
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

    if (markComplete) {
      const { data: profile } = await adminClient.from('profiles').select('tier').eq('id', user.id).maybeSingle()
      const isAdmin = profile?.tier === 'admin'
      if (!isAdmin) {
        const { data: course } = await adminClient.from('courses').select('access_mode').eq('id', lesson.course_id).maybeSingle()
        if (course?.access_mode === 'sequential') {
          return json({ error: 'Episodes on a sequential course can only be completed by watching them.' }, 400)
        }
      }
    }

    const { data: existing } = await adminClient
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', episodeId)
      .maybeSingle()

    const now = new Date().toISOString()
    const patch = markComplete
      ? {
          user_id: user.id,
          lesson_id: episodeId,
          course_id: lesson.course_id,
          seconds: 0,
          duration: existing?.duration ?? null,
          percent: 1,
          completed: true,
          completed_at: now,
          completed_manually: true,
          max_position_seconds: existing?.max_position_seconds ?? existing?.duration ?? 0,
          seconds_watched: existing?.seconds_watched ?? 0,
          vimeo_id: existing?.vimeo_id ?? null,
          playback_rate: existing?.playback_rate ?? null,
          first_watched_at: existing?.first_watched_at || now,
          started_over_at: existing?.started_over_at ?? null,
          updated_at: now,
        }
      : {
          user_id: user.id,
          lesson_id: episodeId,
          course_id: lesson.course_id,
          seconds: existing?.seconds ?? 0,
          duration: existing?.duration ?? null,
          percent: existing?.percent ?? 0,
          completed: false,
          completed_at: null,
          completed_manually: false,
          max_position_seconds: existing?.max_position_seconds ?? 0,
          seconds_watched: existing?.seconds_watched ?? 0,
          vimeo_id: existing?.vimeo_id ?? null,
          playback_rate: existing?.playback_rate ?? null,
          first_watched_at: existing?.first_watched_at || now,
          started_over_at: existing?.started_over_at ?? null,
          updated_at: now,
        }

    const { error: upsertError } = await adminClient.from('lesson_progress').upsert(patch, { onConflict: 'user_id,lesson_id' })
    if (upsertError) throw upsertError

    await recomputeCourseProgress(adminClient, user.id, lesson.course_id)

    return json({ success: true, completed: markComplete })
  } catch (err) {
    console.error('progress-complete error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
