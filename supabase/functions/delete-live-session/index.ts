// Admin-only: deletes a live_sessions row AND its underlying Zoom meeting
// (best-effort -- a Zoom-side failure doesn't block removing the row, since
// an admin trying to delete a stale/already-gone session shouldn't get
// stuck because Zoom 404s on a meeting that's already over/removed).
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

async function getZoomAccessToken(accountId: string, clientId: string, clientSecret: string): Promise<string> {
  const basicAuth = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  )
  if (!res.ok) throw new Error(`Zoom token request failed (${res.status})`)
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
    const sessionId = body.sessionId
    if (!sessionId) return json({ error: 'sessionId is required' }, 400)

    const { data: session } = await adminClient
      .from('live_sessions')
      .select('zoom_meeting_id')
      .eq('id', sessionId)
      .maybeSingle()

    if (session?.zoom_meeting_id) {
      try {
        const { data: zoomSettings } = await adminClient
          .from('zoom_settings')
          .select('account_id, client_id, client_secret')
          .eq('provider', 'zoom')
          .maybeSingle()
        if (zoomSettings?.account_id && zoomSettings?.client_id && zoomSettings?.client_secret) {
          const accessToken = await getZoomAccessToken(zoomSettings.account_id, zoomSettings.client_id, zoomSettings.client_secret)
          await fetch(`https://api.zoom.us/v2/meetings/${session.zoom_meeting_id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        }
      } catch (zoomErr) {
        // Best-effort: log and continue -- the DB row is the source of truth
        // for what members see, and shouldn't get stuck over a Zoom-side issue.
        console.error('delete-live-session: could not delete Zoom meeting', zoomErr)
      }
    }

    const { error: deleteError } = await adminClient.from('live_sessions').delete().eq('id', sessionId)
    if (deleteError) throw deleteError

    return json({ success: true })
  } catch (err) {
    console.error('delete-live-session error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
