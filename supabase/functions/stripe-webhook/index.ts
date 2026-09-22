// Receives Stripe webhook events and syncs subscription / standalone
// course-purchase status into the DB. This is the ONLY place those
// statuses should ever change — never trust a client-reported "I paid"
// claim.
//
// verify_jwt is OFF for this function (see supabase/config.toml) since
// Stripe calls it directly with no Supabase session; the Stripe signature
// check below is what proves the request is genuinely from Stripe instead.
//
// NOT LIVE-TESTABLE without a real Stripe webhook secret — see
// supabase/functions/README.md for setup and the `stripe listen` command
// to test this locally before pointing a real webhook endpoint at it.
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const adminClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Prefers the key an admin has saved via Settings -> Stripe (payment_settings,
// migration 0030) over the STRIPE_SECRET_KEY Edge Function secret, so a key
// pasted into the app takes effect immediately with no redeploy. Falls back
// to the env secret so a project that hasn't touched that new UI keeps
// working exactly as before. payment_settings' RLS only lets anon/
// authenticated read a row when is_caller_admin() (migration 0030/0031), so
// this service-role read is unaffected by it.
async function getStripeSecretKey(): Promise<string> {
  const { data } = await adminClient
    .from('payment_settings')
    .select('secret_key')
    .eq('provider', 'stripe')
    .maybeSingle()
  return data?.secret_key || Deno.env.get('STRIPE_SECRET_KEY') || ''
}

// Maps Stripe's own subscription.status values onto our simpler
// pending/active/failed/cancelled enum (see migration 0011).
function mapSubscriptionStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return 'failed'
    case 'canceled':
    case 'incomplete_expired':
      return 'cancelled'
    default:
      return 'pending'
  }
}

// Upserts one billing_transactions (0032) row for a subscription invoice --
// shared by invoice.paid and invoice.payment_failed. Looks the member up by
// stripe_customer_id since invoices don't carry our own user id; silently
// skips if that customer isn't (or isn't yet) linked to a profile.
async function recordInvoiceTransaction(invoice: Stripe.Invoice, status: 'paid' | 'failed') {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (!profile) return
  await adminClient.from('billing_transactions').upsert(
    {
      user_id: profile.id,
      stripe_invoice_id: invoice.id,
      amount_cents: (status === 'paid' ? invoice.amount_paid : invoice.amount_due) ?? 0,
      currency: invoice.currency,
      status,
      description: 'Monthly membership',
      receipt_url: invoice.hosted_invoice_url ?? null,
      occurred_at: new Date((invoice.created ?? 0) * 1000).toISOString(),
    },
    { onConflict: 'stripe_invoice_id' }
  )
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  const rawBody = await req.text()
  const stripe = new Stripe(await getStripeSecretKey(), {
    apiVersion: '2024-06-20',
  })
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id ?? session.metadata?.supabase_user_id
        if (!userId) break

        if (session.mode === 'subscription') {
          await adminClient
            .from('profiles')
            .update({
              subscription_status: 'active',
              stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
              stripe_subscription_id:
                typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
            })
            .eq('id', userId)
        } else if (session.mode === 'payment') {
          const courseId = session.metadata?.course_id
          if (courseId) {
            await adminClient
              .from('course_purchases')
              .update({
                status: 'completed',
                purchased_at: new Date().toISOString(),
                stripe_payment_intent_id:
                  typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
              })
              .eq('user_id', userId)
              .eq('course_id', courseId)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await adminClient
          .from('profiles')
          .update({ subscription_status: mapSubscriptionStatus(subscription.status) })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await adminClient
          .from('profiles')
          .update({ subscription_status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      // The one place membership charges land in billing_transactions (0032)
      // -- covers both the first invoice a subscription checkout creates and
      // every later renewal, so get-billing-summary and the admin Orders
      // page never have to call Stripe live to show payment history.
      // Upserted on stripe_invoice_id so a webhook retry never double-counts.
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await recordInvoiceTransaction(invoice, 'paid')
        break
      }

      case 'invoice.payment_failed': {
        // Stripe's own Smart Retries schedule the retry attempts; we just
        // reflect the current state so the dashboard payment wall kicks
        // in until a retry succeeds (which arrives as a later
        // customer.subscription.updated -> 'active' event).
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        if (subscriptionId) {
          await adminClient
            .from('profiles')
            .update({ subscription_status: 'failed' })
            .eq('stripe_subscription_id', subscriptionId)
        }
        await recordInvoiceTransaction(invoice, 'failed')
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await adminClient
          .from('course_purchases')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id)
        break
      }

      default:
        // Unhandled event types are expected and fine to ignore.
        break
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('stripe-webhook handler error:', err)
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
