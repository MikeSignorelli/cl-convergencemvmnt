// Resets the resume point to 0 without touching completion state (item #15:
// "Never erases completion") -- this is also what powers "Watch again" for
// an already-completed episode, since that's the same operation: only
// last_position changes, max_position/seconds_watched/completed_at are
// left exactly as they were.
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
    const episodeId = body.episodeId
    if (!episodeId) return json({ error: 'episodeId is required' }, 400)

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

    const now = new Date().toISOString()
    const { data: existing } = await adminClient
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', episodeId)
      .maybeSingle()

    const { error: upsertError } = await adminClient.from('lesson_progress').upsert(
      {
        user_id: user.id,
        lesson_id: episodeId,
        course_id: lesson.course_id,
        seconds: 0,
        duration: existing?.duration ?? null,
        percent: existing?.percent ?? 0,
        completed: existing?.completed ?? false,
        completed_at: existing?.completed_at ?? null,
        completed_manually: existing?.completed_manually ?? false,
        max_position_seconds: existing?.max_position_seconds ?? 0,
        seconds_watched: existing?.seconds_watched ?? 0,
        vimeo_id: existing?.vimeo_id ?? null,
        playback_rate: existing?.playback_rate ?? null,
        first_watched_at: existing?.first_watched_at || now,
        started_over_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id,lesson_id' }
    )
    if (upsertError) throw upsertError

    return json({ success: true })
  } catch (err) {
    console.error('progress-start-over error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
