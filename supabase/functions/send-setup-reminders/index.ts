// Scheduled recovery for members who paid but never finished the profile step
// (task A8). Finds "paid but unfinished" members — subscription_status='active',
// no display_name, not already reminded, past a grace window — and emails each a
// Supabase magic sign-in link that lands on /finish-setup, where they complete
// their profile with NO further charge (see the FinishSetup page). Reuses
// Supabase Auth's own magic-link email, so no third-party email provider is
// needed. Stamps setup_reminder_sent_at so each straggler is nudged once.
//
// NOT a user-facing endpoint: verify_jwt is OFF (see supabase/config.toml); it's
// meant to be called by a scheduler (Supabase Cron / pg_cron+pg_net, or an
// external cron). Protected instead by a shared secret in the x-cron-secret
// header, checked against the SETUP_REMINDER_SECRET env var — set that secret
// before scheduling this.
//
// Query/body options:
//   dryRun (bool)  — resolve the target set and return it WITHOUT sending anything.
//   limit  (int)   — max members to email in one run (default 50; respects Auth rate limits).
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

const GRACE_MINUTES = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Shared-secret gate — this sends real emails, so it must not be publicly callable.
  const expectedSecret = Deno.env.get('SETUP_REMINDER_SECRET')
  if (!expectedSecret || req.headers.get('x-cron-secret') !== expectedSecret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const url = new URL(req.url)
  const body = await req.json().catch(() => ({}))
  const dryRun = url.searchParams.get('dryRun') === 'true' || body?.dryRun === true
  const limit = Number(url.searchParams.get('limit') ?? body?.limit ?? 50)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  // One anon client to trigger the magic-link emails (signInWithOtp is a public
  // Auth call; the service role can't send it).
  const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '')

  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://demo.convergencemvmnt.com'
  const redirectTo = `${siteUrl}/finish-setup`

  try {
    const { data: targets, error: targetsError } = await adminClient.rpc('setup_reminder_targets', {
      p_grace_minutes: GRACE_MINUTES,
    })
    if (targetsError) throw targetsError

    const all = targets ?? []
    if (dryRun) {
      return json({
        dryRun: true,
        totalEligible: all.length,
        graceMinutes: GRACE_MINUTES,
        redirectTo,
        // Emails masked so a dry run never dumps a raw member list into logs.
        sample: all.slice(0, limit).map((t: { email: string }) => maskEmail(t.email)),
      })
    }

    const batch = all.slice(0, limit)
    let sent = 0
    const errors: Array<{ email: string; error: string }> = []

    for (const t of batch) {
      try {
        const { error: otpError } = await anonClient.auth.signInWithOtp({
          email: t.email,
          options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
        })
        if (otpError) throw otpError
        // Stamp only after the email actually went out, so a send failure
        // leaves them eligible for the next run rather than silently skipped.
        await adminClient
          .from('profiles')
          .update({ setup_reminder_sent_at: new Date().toISOString() })
          .eq('id', t.id)
        sent++
      } catch (err) {
        errors.push({ email: maskEmail(t.email), error: err instanceof Error ? err.message : 'unknown' })
      }
    }

    return json({ dryRun: false, totalEligible: all.length, attempted: batch.length, sent, errors })
  } catch (err) {
    console.error('send-setup-reminders error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})

function maskEmail(email: string): string {
  const [local, domain] = (email ?? '').split('@')
  if (!domain) return '***'
  const head = local.slice(0, 2)
  return `${head}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`
}
