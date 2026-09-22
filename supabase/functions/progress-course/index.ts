// One round trip for everything a course page's progress UI needs: the
// course-level rollup, a per-episode map (position/percent/completed/
// canPlay/lockReason), and which episode+position to resume into.
//
// canPlay/lockReason per episode come from course_episode_access (0039),
// which itself just loops can_play_episode -- the single source of truth
// also used by the heartbeat/complete/start-over functions and by
// get_lesson_video_url, so this endpoint can never show an episode as
// playable that playback would then reject.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
    const courseId = body.courseId
    if (!courseId) return json({ error: 'courseId is required' }, 400)

    const { data: course } = await adminClient.from('courses').select('id').eq('id', courseId).is('deleted_at', null).maybeSingle()
    if (!course) return json({ error: 'Course not found' }, 404)

    const [{ data: lessons }, { data: progressRows }, { data: access }, { data: rollup }] = await Promise.all([
      adminClient
        .from('course_lessons')
        .select('id, week_number, position, created_at')
        .eq('course_id', courseId)
        .order('week_number', { ascending: true, nullsFirst: false })
        .order('position', { ascending: true })
        .order('created_at', { ascending: true }),
      adminClient
        .from('lesson_progress')
        .select('lesson_id, seconds, max_position_seconds, seconds_watched, duration, percent, completed, completed_at, vimeo_id, updated_at')
        .eq('user_id', user.id)
        .eq('course_id', courseId),
      adminClient.rpc('course_episode_access', { p_user_id: user.id, p_course_id: courseId }),
      adminClient.from('course_progress').select('*').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
    ])

    const progressByLesson = new Map((progressRows || []).map((r) => [r.lesson_id, r]))
    const accessByLesson = new Map((access || []).map((r: { lesson_id: string; allowed: boolean; reason: string }) => [r.lesson_id, r]))

    const episodes: Record<string, unknown> = {}
    let resumeEpisodeId: string | null = null
    let resumePosition = 0
    let mostRecentWatchedAt: string | null = null
    let firstIncompletePlayableId: string | null = null

    for (const lesson of lessons || []) {
      const p = progressByLesson.get(lesson.id)
      const a = accessByLesson.get(lesson.id)
      const canPlay = !!a?.allowed
      const completed = !!p?.completed

      episodes[lesson.id] = {
        position: Number(p?.seconds) || 0,
        maxPosition: Number(p?.max_position_seconds) || 0,
        secondsWatched: Number(p?.seconds_watched) || 0,
        duration: p?.duration != null ? Number(p.duration) : null,
        percent: p?.percent != null ? Number(p.percent) : 0,
        completed,
        completedAt: p?.completed_at || null,
        vimeoId: p?.vimeo_id || null,
        canPlay,
        lockReason: canPlay ? null : a?.reason || 'not_entitled',
      }

      if (canPlay && !completed && !firstIncompletePlayableId) {
        firstIncompletePlayableId = lesson.id
      }
      if (p && !completed && p.updated_at && (!mostRecentWatchedAt || p.updated_at > mostRecentWatchedAt)) {
        mostRecentWatchedAt = p.updated_at
        resumeEpisodeId = lesson.id
        resumePosition = Number(p.seconds) || 0
      }
    }

    // Resume target precedence, per spec: last touched-and-incomplete
    // episode -> else first incomplete playable episode -> else episode 1.
    if (!resumeEpisodeId) {
      resumeEpisodeId = firstIncompletePlayableId || (lessons && lessons[0]?.id) || null
      resumePosition = 0
    }

    return json({
      rollup: rollup || {
        user_id: user.id,
        course_id: courseId,
        total_episodes: (lessons || []).length,
        completed_episodes: 0,
        percent: 0,
        total_seconds_watched: 0,
        last_episode_id: null,
        last_watched_at: null,
        started_at: null,
        completed_at: null,
      },
      episodes,
      resumeEpisodeId,
      resumePosition,
    })
  } catch (err) {
    console.error('progress-course error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
