// Every in-progress (not finished, not abandoned) course for the current
// member, newest activity first -- powers the Course Library's "Continue
// Watching" row and the same component reused on the Dashboard.
//
// "Untouched for > 90 days" drops out of this list (per the confirmed
// decide) -- the course page itself still resumes normally, this only
// affects whether it's surfaced in this particular shortlist.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

const STALE_DAYS = 90
const DEFAULT_LIMIT = 6

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
    const limit = Number.isFinite(body.limit) && body.limit > 0 ? Math.min(20, Math.round(body.limit)) : DEFAULT_LIMIT

    const staleCutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { data: rows, error } = await adminClient
      .from('course_progress')
      .select(
        'course_id, percent, completed_episodes, total_episodes, last_watched_at, last_episode_id, courses(title, thumbnail_path), course_lessons(title, week_number)'
      )
      .eq('user_id', user.id)
      .gt('percent', 0)
      .lt('percent', 100)
      .gte('last_watched_at', staleCutoff)
      .order('last_watched_at', { ascending: false })
      .limit(limit)
    if (error) throw error

    const items = (rows || []).map((r) => ({
      courseId: r.course_id,
      courseTitle: r.courses?.title || 'Untitled course',
      thumbnailPath: r.courses?.thumbnail_path || null,
      percent: Number(r.percent) || 0,
      completedEpisodes: r.completed_episodes,
      totalEpisodes: r.total_episodes,
      lastWatchedAt: r.last_watched_at,
      lastEpisodeId: r.last_episode_id,
      lastEpisodeTitle: r.course_lessons?.title || null,
      lastEpisodeWeek: r.course_lessons?.week_number ?? null,
    }))

    return json({ items })
  } catch (err) {
    console.error('progress-continue-watching error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
