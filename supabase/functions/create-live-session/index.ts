// Admin-only: creates a real Zoom meeting via Zoom's Server-to-Server OAuth
// API (credentials from Settings -> Live sessions, migration 0036) and
// saves a live_sessions row pointing at the real join_url Zoom returns --
// an admin never pastes a Zoom link by hand. join_before_host is turned on
// so members can join right at the scheduled time with no admin action to
// "open" the meeting first (see settings below).
//
// NOT LIVE-TESTABLE without real Zoom Server-to-Server OAuth credentials --
// same caveat as the Stripe functions before real keys were configured.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Exchanges the account's Server-to-Server OAuth app credentials for a
// short-lived (~1hr) access token -- fetched fresh on every call rather
// than cached, since this function runs rarely (an admin scheduling a
// session), not on a hot path.
async function getZoomAccessToken(accountId: string, clientId: string, clientSecret: string): Promise<string> {
  const basicAuth = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Zoom rejected the configured credentials (${res.status}). ${detail}`)
  }
  const data = await res.json()
  return data.access_token
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) {
      return json({ error: 'Not authenticated' }, 401)
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('tier')
      .eq('id', userData.user.id)
      .maybeSingle()
    if (profile?.tier !== 'admin') {
      return json({ error: 'Admin access required' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const title = (body.title || '').trim()
    const description = (body.description || '').trim()
    const visibleTiers = Array.isArray(body.visibleTiers) && body.visibleTiers.length ? body.visibleTiers : ['disciple', 'leader', 'pastor']
    const scheduledAt = body.scheduledAt
    const durationMinutes = Number.isFinite(body.durationMinutes) && body.durationMinutes > 0 ? Math.round(body.durationMinutes) : 60
    if (!title) return json({ error: 'Title is required' }, 400)
    if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) return json({ error: 'A valid scheduled time is required' }, 400)

    const { data: zoomSettings } = await adminClient
      .from('zoom_settings')
      .select('account_id, client_id, client_secret')
      .eq('provider', 'zoom')
      .maybeSingle()
    if (!zoomSettings?.account_id || !zoomSettings?.client_id || !zoomSettings?.client_secret) {
      return json({ error: "Zoom isn't configured yet -- add your Zoom API credentials in Settings -> Live sessions." }, 400)
    }

    const accessToken = await getZoomAccessToken(zoomSettings.account_id, zoomSettings.client_id, zoomSettings.client_secret)

    const meetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: title,
        agenda: description || undefined,
        type: 2, // scheduled meeting
        start_time: new Date(scheduledAt).toISOString(),
        duration: durationMinutes,
        timezone: 'UTC',
        settings: {
          // No manual admin action needed to "open" the meeting -- members
          // can join at the scheduled time even if the host hasn't started it.
          join_before_host: true,
          waiting_room: false,
          approval_type: 2, // no registration required
          meeting_authentication: false,
        },
      }),
    })
    if (!meetingRes.ok) {
      const detail = await meetingRes.text().catch(() => '')
      return json({ error: `Zoom could not create the meeting (${meetingRes.status}). ${detail}` }, 502)
    }
    const meeting = await meetingRes.json()

    const { data: session, error: insertError } = await adminClient
      .from('live_sessions')
      .insert({
        title,
        description: description || null,
        visible_tiers: visibleTiers,
        scheduled_at: new Date(scheduledAt).toISOString(),
        join_url: meeting.join_url,
        zoom_meeting_id: String(meeting.id),
        created_by: userData.user.id,
      })
      .select('id, title, description, visible_tiers, scheduled_at, join_url, zoom_meeting_id, created_at')
      .single()
    if (insertError) throw insertError

    return json({ session })
  } catch (err) {
    console.error('create-live-session error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
