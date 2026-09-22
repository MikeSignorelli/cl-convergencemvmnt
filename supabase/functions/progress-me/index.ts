// Powers the real My Progress page: every entitled course with its bar,
// total watch time, and a streak.
//
// CAVEAT on the streak (flagged in the delivery notes too): the confirmed
// definition is "a day counts if >=5 real minutes were watched that day,
// computed live from lesson_progress, no new table." lesson_progress only
// keeps ONE cumulative seconds_watched + one updated_at per (user, lesson)
// -- it has no per-day breakdown, so if a lesson was watched across two
// different days, we can't know how many of those minutes fell on which
// day. This computes the closest honest approximation from existing data:
// a calendar day counts as active if the user has at least one
// lesson_progress row whose updated_at falls on that day (i.e. they made
// measurable progress that day) -- not a verified >=5-minutes-that-day
// figure, since that would need a daily activity log this pass doesn't add.
// True per-day precision is a fast-follow if it matters (one small
// `daily_watch_activity` table, written by progress-heartbeat).
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function dayKeyUTC(iso: string) {
  return iso.slice(0, 10) // 'YYYY-MM-DD'
}

function computeStreak(activeDayKeys: Set<string>): number {
  const today = new Date()
  const oneDay = 24 * 60 * 60 * 1000
  const todayKey = dayKeyUTC(today.toISOString())
  const yesterdayKey = dayKeyUTC(new Date(today.getTime() - oneDay).toISOString())
  // A streak stays "alive" through today even if today has no activity yet
  // (the day isn't over) -- only counts as broken once yesterday AND today
  // both have no activity.
  let cursor = activeDayKeys.has(todayKey) ? today : activeDayKeys.has(yesterdayKey) ? new Date(today.getTime() - oneDay) : null
  if (!cursor) return 0
  let streak = 0
  for (;;) {
    const key = dayKeyUTC(cursor.toISOString())
    if (!activeDayKeys.has(key)) break
    streak += 1
    cursor = new Date(cursor.getTime() - oneDay)
  }
  return streak
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

    const { data: profile } = await adminClient
      .from('profiles')
      .select('tier, subscription_status')
      .eq('id', user.id)
      .maybeSingle()
    const hasActiveMembership = profile?.tier === 'admin' || profile?.subscription_status === 'active'

    const { data: purchases } = await adminClient
      .from('course_purchases')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
    const purchasedCourseIds = new Set((purchases || []).map((p) => p.course_id))

    // Entitled course set: every published course when membership is
    // active, otherwise just the ones actually purchased.
    let coursesQuery = adminClient
      .from('courses')
      .select('id, title, thumbnail_path')
      .is('deleted_at', null)
      .eq('status', 'published')
    if (!hasActiveMembership) {
      coursesQuery = coursesQuery.in('id', purchasedCourseIds.size ? Array.from(purchasedCourseIds) : ['00000000-0000-0000-0000-000000000000'])
    }
    const { data: entitledCourses } = await coursesQuery

    const courseIds = (entitledCourses || []).map((c) => c.id)
    const { data: rollups } = courseIds.length
      ? await adminClient.from('course_progress').select('*').eq('user_id', user.id).in('course_id', courseIds)
      : { data: [] }
    const rollupByCourseId = new Map((rollups || []).map((r) => [r.course_id, r]))

    const { data: allProgressRows } = await adminClient
      .from('lesson_progress')
      .select('seconds_watched, updated_at')
      .eq('user_id', user.id)

    let totalSecondsWatched = 0
    const activeDayKeys = new Set<string>()
    for (const row of allProgressRows || []) {
      totalSecondsWatched += Number(row.seconds_watched) || 0
      if (row.updated_at) activeDayKeys.add(dayKeyUTC(row.updated_at))
    }
    const streak = computeStreak(activeDayKeys)

    const inProgress: unknown[] = []
    const completed: unknown[] = []
    const notStarted: unknown[] = []
    for (const course of entitledCourses || []) {
      const rollup = rollupByCourseId.get(course.id)
      const percent = Number(rollup?.percent) || 0
      const entry = {
        courseId: course.id,
        title: course.title,
        thumbnailPath: course.thumbnail_path,
        percent,
        completedEpisodes: rollup?.completed_episodes || 0,
        totalEpisodes: rollup?.total_episodes || 0,
        lastWatchedAt: rollup?.last_watched_at || null,
        lastEpisodeId: rollup?.last_episode_id || null,
      }
      if (percent >= 100) completed.push(entry)
      else if (percent > 0) inProgress.push(entry)
      else notStarted.push(entry)
    }
    inProgress.sort((a: { lastWatchedAt?: string }, b: { lastWatchedAt?: string }) =>
      (b.lastWatchedAt || '').localeCompare(a.lastWatchedAt || '')
    )

    return json({
      streak,
      totalSecondsWatched,
      coursesStarted: inProgress.length + completed.length,
      coursesCompleted: completed.length,
      inProgress,
      completed,
      notStarted,
    })
  } catch (err) {
    console.error('progress-me error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
