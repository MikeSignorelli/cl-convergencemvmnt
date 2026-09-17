// Cancels (or un-cancels) the caller's own membership subscription at the
// end of the current billing period — never an immediate cancel/delete, so
// the member always keeps access through what they already paid for.
//
// Branches on body.action ('cancel' | 'resume') to flip Stripe's
// cancel_at_period_end flag; both directions are the same operation, just
// the opposite boolean. The subscription id is looked up from the caller's
// own profiles row (via their verified JWT), exactly like
// create-checkout-session and get-billing-summary — never trust a
// subscription id passed in the request body.
//
// This file was deployed directly and only just added to the repo — its
// live behavior (verified via the Supabase dashboard) is unchanged except
// for the Stripe-key lookup below.
//
// NOT LIVE-TESTABLE without real Stripe keys — see
// supabase/functions/README.md.
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Prefers the key an admin has saved via Settings -> Stripe (payment_settings,
// migration 0030) over the STRIPE_SECRET_KEY Edge Function secret, so a key
// pasted into the app takes effect immediately with no redeploy. Falls back
// to the env secret so a project that hasn't touched that new UI keeps
// working exactly as before. adminClient is the service-role client -- the
// column-level REVOKE on payment_settings.secret_key only targets
// anon/authenticated, so this read is unaffected by it.
async function getStripeSecretKey(adminClient: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await adminClient
    .from('payment_settings')
    .select('secret_key')
    .eq('provider', 'stripe')
    .maybeSingle()
  return data?.secret_key || Deno.env.get('STRIPE_SECRET_KEY') || ''
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
    const stripe = new Stripe(await getStripeSecretKey(adminClient), {
      apiVersion: '2024-06-20',
    })

    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const user = userData.user

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, stripe_subscription_id')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'No member profile found for this account' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!profile.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'No active subscription found for this account' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const cancelAtPeriodEnd = body.action !== 'resume' // default to 'cancel' unless explicitly resuming

    const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: cancelAtPeriodEnd,
    })

    return new Response(
      JSON.stringify({
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('cancel-subscription error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
