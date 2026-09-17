// Returns everything the member-facing Billing page needs to render in one
// call: current membership status (with next billing date / upcoming
// charge / cancel-at-period-end), and a merged, newest-first transaction
// history combining Stripe subscription invoices with one-time
// course_purchases rows.
//
// Identity is derived ENTIRELY from the caller's own verified JWT, exactly
// like create-checkout-session: never trust a client-supplied user id,
// customer id, or subscription id. This function only ever reads Stripe
// data (and course_purchases rows) belonging to the profile row matching
// the authenticated caller — see supabase/functions/README.md for the
// identity-verification pattern this mirrors.
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

const PAST_INVOICES_LIMIT = 24

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
    // Same two-client split as create-checkout-session: the user-scoped
    // client only identifies who's asking; every actual read goes through
    // the service-role client.
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
      .select('id, stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'No member profile found for this account' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Never checked out (membership or a la carte) at all yet — nothing to
    // show. This is the "join to get started" empty state, not an error.
    if (!profile.stripe_customer_id) {
      return new Response(
        JSON.stringify({ hasStripeCustomer: false, membership: null, transactions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customerId = profile.stripe_customer_id

    // --- Membership: live subscription state + upcoming invoice ---
    let membership = null
    if (profile.stripe_subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)

      let upcomingAmountCents = null
      let upcomingCurrency = null
      let upcomingDate = null
      try {
        const upcoming = await stripe.invoices.retrieveUpcoming({
          customer: customerId,
          subscription: profile.stripe_subscription_id,
        })
        upcomingAmountCents = upcoming.amount_due
        upcomingCurrency = upcoming.currency
        upcomingDate = upcoming.next_payment_attempt
          ? new Date(upcoming.next_payment_attempt * 1000).toISOString()
          : null
      } catch (_upcomingErr) {
        // Stripe throws when there's no upcoming invoice to preview (e.g. a
        // fully cancelled subscription) — that's "no upcoming payment", not
        // a real error.
        upcomingAmountCents = null
        upcomingCurrency = null
        upcomingDate = null
      }

      membership = {
        status: profile.subscription_status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        upcomingAmountCents,
        upcomingCurrency,
        upcomingDate,
      }
    } else {
      membership = {
        status: profile.subscription_status,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        upcomingAmountCents: null,
        upcomingCurrency: null,
        upcomingDate: null,
      }
    }

    // --- Past subscription invoices ---
    const invoices = await stripe.invoices.list({ customer: customerId, limit: PAST_INVOICES_LIMIT })
    const invoiceTransactions = invoices.data.map((invoice) => ({
      id: invoice.id,
      type: 'membership',
      description: 'Monthly membership',
      date: new Date((invoice.created ?? 0) * 1000).toISOString(),
      amountCents: invoice.amount_paid ?? invoice.amount_due ?? 0,
      currency: invoice.currency,
      status: invoice.status, // draft | open | paid | uncollectible | void
      receiptUrl: invoice.hosted_invoice_url ?? null,
    }))

    // --- One-time a la carte course purchases (this user's rows only) ---
    const { data: purchases, error: purchasesError } = await adminClient
      .from('course_purchases')
      .select('id, status, purchased_at, created_at, courses(title, price_cents)')
      .eq('user_id', user.id)
    if (purchasesError) throw purchasesError

    const courseTransactions = (purchases || []).map((purchase) => ({
      id: purchase.id,
      type: 'course',
      description: purchase.courses?.title || 'Course purchase',
      date: new Date(purchase.purchased_at || purchase.created_at).toISOString(),
      amountCents: purchase.courses?.price_cents ?? 0,
      currency: 'usd',
      status: purchase.status, // pending | completed | failed
      receiptUrl: null,
    }))

    const transactions = [...invoiceTransactions, ...courseTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return new Response(
      JSON.stringify({ hasStripeCustomer: true, membership, transactions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('get-billing-summary error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
