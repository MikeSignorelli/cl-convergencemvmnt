// Confirms a completed Stripe Checkout Session on demand, as a stand-in for
// the stripe-webhook when no webhook endpoint exists for the Stripe account.
//
// WHY THIS EXISTS
// stripe-webhook is the correct mechanism: Stripe pushes every billing event
// (initial payment, renewals, cancellations, failed cards) to us, whether or
// not anyone has a browser open. It needs STRIPE_WEBHOOK_SECRET, which only
// comes from creating an endpoint in the Stripe Dashboard. Where that hasn't
// been done, a member can pay and never be activated: nothing is listening,
// so subscription_status stays 'pending' and they're locked out of what they
// just bought.
//
// This function closes that specific gap by inverting the direction — instead
// of waiting to be told, it asks Stripe directly when the member lands back
// on the site after checkout. The browser passes the Checkout Session id
// (Stripe substitutes it into success_url via {CHECKOUT_SESSION_ID}), we
// retrieve that session server-side and apply the same writes
// checkout.session.completed would have.
//
// WHAT IT DOES NOT COVER — read before relying on it
// It only fires when a member returns to the site straight after paying.
// Anything asynchronous is invisible to it:
//   - monthly renewals (no browser involved)
//   - cancellations made from Stripe's billing portal
//   - failed/declined recurring charges
//   - someone who pays then closes the tab before redirecting back
// Those all still need the webhook. Treat this as a bridge, not a
// replacement, and delete it once STRIPE_WEBHOOK_SECRET is configured.
//
// SECURITY
// verify_jwt stays on (the default), so `user` below is the authenticated
// caller. The session is matched against that caller's own id via
// client_reference_id before anything is written — otherwise anyone who
// learned another member's session id could activate their own membership
// off someone else's payment. We also require Stripe to report the session
// as actually paid, so an abandoned or unpaid session can't activate anyone.
import Stripe from 'npm:stripe@17'
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

// Same precedence as create-checkout-session and stripe-webhook: a key saved
// through Settings -> Payments wins over the env secret, so a key pasted into
// the admin UI takes effect with no redeploy.
async function getStripeSecretKey(adminClient: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await adminClient
    .from('payment_settings')
    .select('secret_key')
    .eq('provider', 'stripe')
    .maybeSingle()
  return data?.secret_key || Deno.env.get('STRIPE_SECRET_KEY') || ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // Identify the caller from their own JWT. Never trust a user id in the
    // body — that would let anyone activate any account.
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: userData } = await userClient.auth.getUser()
    const user = userData?.user
    if (!user) return json({ error: 'Not authenticated' }, 401)

    const body = await req.json().catch(() => ({}))
    const sessionId = body?.sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return json({ error: 'sessionId is required' }, 400)
    }

    const secretKey = await getStripeSecretKey(adminClient)
    if (!secretKey) return json({ error: 'Stripe is not configured' }, 500)
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    })

    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId)
    } catch (err) {
      // Covers a bad id, and the common mode mismatch where a session from
      // test mode is looked up with a live key (or vice versa).
      return json({ error: err instanceof Error ? err.message : 'Could not retrieve session' }, 400)
    }

    // The session must belong to the caller. client_reference_id is set to
    // the member's id when the session is created; metadata is the fallback
    // for sessions created before that was added.
    const sessionUserId = session.client_reference_id ?? session.metadata?.supabase_user_id
    if (!sessionUserId || sessionUserId !== user.id) {
      return json({ error: 'This checkout session does not belong to you' }, 403)
    }

    // Only act on a session Stripe considers paid. 'no_payment_required'
    // covers a 100%-off coupon, which is still a legitimate activation.
    const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
    if (!paid) {
      return json({ confirmed: false, reason: `payment_status is '${session.payment_status}'` })
    }

    // ---- Membership subscription -------------------------------------
    // Mirrors stripe-webhook's checkout.session.completed / subscription
    // branch, including recording the first charge so Payment History isn't
    // empty for it.
    if (session.mode === 'subscription') {
      await adminClient
        .from('profiles')
        .update({
          subscription_status: 'active',
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
          stripe_subscription_id:
            typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
        })
        .eq('id', user.id)

      const invoiceId = typeof session.invoice === 'string' ? session.invoice : session.invoice?.id
      if (invoiceId) {
        let receiptUrl: string | null = null
        try {
          const invoice = await stripe.invoices.retrieve(invoiceId)
          receiptUrl = invoice.hosted_invoice_url ?? null
        } catch (invoiceErr) {
          console.error('confirm-checkout: could not retrieve invoice', invoiceErr)
        }
        // Upserted on stripe_invoice_id, the same conflict target the webhook
        // uses — so if a webhook is configured later and replays this event,
        // it fills in the same row rather than duplicating the charge.
        await adminClient.from('billing_transactions').upsert(
          {
            user_id: user.id,
            stripe_invoice_id: invoiceId,
            amount_cents: session.amount_total ?? 0,
            currency: session.currency ?? 'usd',
            status: 'paid',
            description: 'Monthly membership',
            receipt_url: receiptUrl,
            occurred_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_invoice_id' }
        )
      }

      return json({ confirmed: true, type: 'membership' })
    }

    // ---- One-time membership -----------------------------------------
    // The membership is currently sold as a one-time charge rather than a
    // subscription, because STRIPE_MEMBERSHIP_PRICE_ID is a one-time price
    // (see create-checkout-session). It therefore arrives here in 'payment'
    // mode like a course purchase, and is told apart by metadata.type.
    // Checked before the course branch, which would otherwise swallow it.
    if (session.mode === 'payment' && session.metadata?.type === 'membership') {
      const paymentIntentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id

      await adminClient
        .from('profiles')
        .update({
          subscription_status: 'active',
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        })
        .eq('id', user.id)

      // No invoice exists in payment mode, so the PaymentIntent id stands in
      // as the unique key for this charge. billing_transactions.stripe_invoice_id
      // is just "the Stripe object identifying this charge" as far as the
      // unique constraint and the upsert are concerned, so this keeps the same
      // idempotency without needing a migration.
      if (paymentIntentId) {
        let receiptUrl: string | null = null
        try {
          const intent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] })
          const charge = intent.latest_charge
          if (charge && typeof charge !== 'string') receiptUrl = charge.receipt_url ?? null
        } catch (intentErr) {
          console.error('confirm-checkout: could not retrieve payment intent', intentErr)
        }
        await adminClient.from('billing_transactions').upsert(
          {
            user_id: user.id,
            stripe_invoice_id: paymentIntentId,
            amount_cents: session.amount_total ?? 0,
            currency: session.currency ?? 'usd',
            status: 'paid',
            description: 'Membership',
            receipt_url: receiptUrl,
            occurred_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_invoice_id' }
        )
      }

      return json({ confirmed: true, type: 'membership' })
    }

    // ---- One-time standalone course purchase -------------------------
    if (session.mode === 'payment') {
      const courseId = session.metadata?.course_id
      if (!courseId) return json({ confirmed: false, reason: 'session has no course_id' })

      await adminClient
        .from('course_purchases')
        .update({
          status: 'completed',
          purchased_at: new Date().toISOString(),
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
        })
        .eq('user_id', user.id)
        .eq('course_id', courseId)

      return json({ confirmed: true, type: 'course', courseId })
    }

    return json({ confirmed: false, reason: `unhandled session mode '${session.mode}'` })
  } catch (err) {
    console.error('confirm-checkout failed:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
