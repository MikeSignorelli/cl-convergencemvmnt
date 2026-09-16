// Scheduled health sweep over course_lessons, flagging episodes an admin
// should look at: a missing/unparseable video link, an episode releasing
// soon with no video yet, or a previously-good Vimeo link that no longer
// resolves (deleted/made private after being linked). Results land in
// course_health_flags (migration 0029), which the admin course list
// (UploadCourses.jsx, via src/lib/courseHealth.js) reads to show a banner.
//
// AUTH — deliberately different from send-setup-reminders (this repo's other
// scheduled job): that function only ever runs from a scheduler, so
// verify_jwt is off and it's gated purely by a shared secret. This function
// has a SECOND caller — an admin's browser, clicking "Check Vimeo links now"
// on the course list for an on-demand run instead of waiting for the
// schedule. An authenticated browser call can't carry a cron secret (that
// would mean shipping the secret to every admin's client), so rather than
// stand up a whole second Edge Function that duplicates this logic scoped
// to on-demand use (option "b" in the task), this ONE function accepts
// EITHER:
//   - the x-cron-secret header (checked against COURSE_HEALTH_SECRET),
//     exactly like send-setup-reminders, for the external scheduler; or
//   - a normal Supabase Auth JWT belonging to a profile with tier='admin'
//     (checked the same way list-stripe-products.ts checks its own
//     server-side admin gate), for the on-demand button.
// Because of that second path, config.toml sets verify_jwt = TRUE here (see
// the comment there) so the gateway requires *some* valid JWT on every call
// — the scheduler satisfies that with the project's anon key in the
// Authorization header (a normal requirement for calling any Edge Function
// over HTTP), then this function's own check below decides whether the
// caller is actually the cron job (x-cron-secret) or an admin (their JWT).
// Smaller diff than a second function, and keeps the "how do I check
// episodes right now" logic in exactly one place.
//
// Query/body options:
//   dryRun     (bool) — compute + return the findings WITHOUT writing them.
//   daysAhead  (int)  — "upcoming" notice window in days (default 3): an
//                        episode releasing within this many days with no
//                        video yet becomes an upcoming_no_video flag.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const DEFAULT_DAYS_AHEAD = 3
// Vimeo's oEmbed endpoint is public/unauthenticated but rate-limited and not
// something to hammer on every run for a large library — cap how many
// non-null-vimeo_id lessons get a live re-check per invocation. When the
// library has more linked lessons than this, a random sample is checked
// instead of always the same ones, so coverage rotates across runs rather
// than permanently ignoring everything past the first 50.
const VIMEO_CHECK_CAP = 50

type LessonRow = {
  id: string
  course_id: string
  title: string
  release_at: string | null
  vimeo_id: string | null
  video_url?: string
  courses: { title: string | null; deleted_at: string | null } | null
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// A non-200 oEmbed response (or a network failure) means the video is gone,
// private, or otherwise unreachable — any of which is a broken link from an
// admin's point of view.
async function isVimeoLinkBroken(videoUrl: string): Promise<boolean> {
  try {
    const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`
    const res = await fetch(endpoint)
    return !res.ok
  } catch {
    return true
  }
}

function flagKey(lessonId: string, flagType: string) {
  return `${lessonId}:${flagType}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  // ---- Auth gate: cron secret OR admin JWT (see top-of-file note) ----------
  const cronSecret = Deno.env.get('COURSE_HEALTH_SECRET')
  const isCronCall = !!cronSecret && req.headers.get('x-cron-secret') === cronSecret

  let isAdminCall = false
  if (!isCronCall) {
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await userClient.auth.getUser()
    if (userData?.user) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('tier')
        .eq('id', userData.user.id)
        .maybeSingle()
      isAdminCall = profile?.tier === 'admin'
    }
  }

  if (!isCronCall && !isAdminCall) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const url = new URL(req.url)
  const body = await req.json().catch(() => ({}))
  const dryRun = url.searchParams.get('dryRun') === 'true' || body?.dryRun === true
  const daysAhead = Number(url.searchParams.get('daysAhead') ?? body?.daysAhead ?? DEFAULT_DAYS_AHEAD)

  try {
    const nowIso = new Date().toISOString()
    const windowEndIso = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString()

    // (a) Missing/invalid video — no usable vimeo_id, and not covered by the
    // "upcoming" window below: either already released (or overdue) with no
    // working video, or no release date at all. (Ordering vimeo_id IS NULL
    // by *when* it's due is what turns the task's literal "vimeo_id is null
    // OR (release_at in the past AND vimeo_id is null)" — the second clause
    // being a strict subset of the first — into two non-overlapping flag
    // types instead of double-flagging the same lesson twice.)
    const { data: missingRows, error: missingError } = await adminClient
      .from('course_lessons')
      .select('id, course_id, title, release_at, vimeo_id, courses(title, deleted_at)')
      .is('vimeo_id', null)
      .or(`release_at.is.null,release_at.lte.${nowIso}`)
    if (missingError) throw missingError

    // (b) Upcoming episodes with no video yet — releasing within the notice
    // window, still nothing to play.
    const { data: upcomingRows, error: upcomingError } = await adminClient
      .from('course_lessons')
      .select('id, course_id, title, release_at, vimeo_id, courses(title, deleted_at)')
      .is('vimeo_id', null)
      .gt('release_at', nowIso)
      .lte('release_at', windowEndIso)
    if (upcomingError) throw upcomingError

    // (c) Broken links — a sampled/capped live re-check of already-linked
    // episodes (see VIMEO_CHECK_CAP above).
    const { data: vimeoRows, error: vimeoError } = await adminClient
      .from('course_lessons')
      .select('id, course_id, title, video_url, vimeo_id, courses(title, deleted_at)')
      .not('vimeo_id', 'is', null)
    if (vimeoError) throw vimeoError

    const liveMissing = ((missingRows as LessonRow[]) || []).filter((r) => !r.courses?.deleted_at)
    const liveUpcoming = ((upcomingRows as LessonRow[]) || []).filter((r) => !r.courses?.deleted_at)
    const liveVimeoLinked = ((vimeoRows as LessonRow[]) || []).filter((r) => !r.courses?.deleted_at)

    const sampled = liveVimeoLinked.length > VIMEO_CHECK_CAP
    const vimeoSample = sampled ? shuffle(liveVimeoLinked).slice(0, VIMEO_CHECK_CAP) : liveVimeoLinked

    const brokenChecks = await Promise.all(
      vimeoSample.map(async (row) => ({ row, broken: await isVimeoLinkBroken(row.video_url || '') }))
    )
    const brokenRows = brokenChecks.filter((c) => c.broken).map((c) => c.row)

    const nextFlags = [
      ...liveMissing.map((r) => ({ lesson_id: r.id, course_id: r.course_id, flag_type: 'missing_video' })),
      ...liveUpcoming.map((r) => ({ lesson_id: r.id, course_id: r.course_id, flag_type: 'upcoming_no_video' })),
      ...brokenRows.map((r) => ({ lesson_id: r.id, course_id: r.course_id, flag_type: 'broken_link' })),
    ]

    // Diff against the currently-unresolved set so the summary can say what
    // actually changed (cleared vs. newly flagged), not just the raw totals.
    const { data: previousFlags, error: previousError } = await adminClient
      .from('course_health_flags')
      .select('lesson_id, flag_type')
      .is('resolved_at', null)
    if (previousError) throw previousError

    const previousKeys = new Set((previousFlags || []).map((f) => flagKey(f.lesson_id, f.flag_type)))
    const nextKeys = new Set(nextFlags.map((f) => flagKey(f.lesson_id, f.flag_type)))
    const clearedCount = [...previousKeys].filter((k) => !nextKeys.has(k)).length
    const newlyFlaggedCount = [...nextKeys].filter((k) => !previousKeys.has(k)).length

    const summary = {
      dryRun,
      daysAhead,
      checkedAt: nowIso,
      flagged: {
        missing_video: liveMissing.length,
        upcoming_no_video: liveUpcoming.length,
        broken_link: brokenRows.length,
      },
      total: nextFlags.length,
      cleared: clearedCount,
      newlyFlagged: newlyFlaggedCount,
      vimeoLinks: { total: liveVimeoLinked.length, checked: vimeoSample.length, sampled },
      // Capped preview so the "Check Vimeo links now" button can show
      // something useful immediately without a second query.
      sample: nextFlags.slice(0, 20).map((f) => {
        const source = [...liveMissing, ...liveUpcoming, ...brokenRows].find((r) => r.id === f.lesson_id)
        return {
          lessonId: f.lesson_id,
          courseId: f.course_id,
          flagType: f.flag_type,
          lessonTitle: source?.title,
          courseTitle: source?.courses?.title,
        }
      }),
    }

    if (dryRun) return json(summary)

    // Delete-and-reinsert-unresolved-only: this run's findings are a fresh,
    // complete recomputation, so every currently-unresolved row is replaced
    // wholesale rather than diffed row by row. Any row an admin has since
    // marked resolved (resolved_at not null) is untouched by this delete.
    const { error: deleteError } = await adminClient.from('course_health_flags').delete().is('resolved_at', null)
    if (deleteError) throw deleteError

    if (nextFlags.length > 0) {
      const { error: insertError } = await adminClient.from('course_health_flags').insert(nextFlags)
      if (insertError) throw insertError
    }

    return json(summary)
  } catch (err) {
    console.error('course-health-check error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
