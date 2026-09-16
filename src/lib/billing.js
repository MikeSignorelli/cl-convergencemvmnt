import { supabase } from './supabaseClient'

// Calls the create-checkout-session Edge Function (see
// supabase/functions/README.md) and redirects the browser to the Stripe
// Checkout URL it returns. Requires real Stripe keys to be configured on
// the Edge Function before this will actually work end to end.
//
// returnTo controls where Stripe sends the browser back to after checkout
// (?checkout=success or =cancelled appended) — the dashboard's own
// PaymentWall omits it (defaults server-side to /dashboard), while the
// onboarding payment step passes '/onboarding' so it resumes the wizard
// instead of dropping the still-mid-onboarding user onto the dashboard.
export async function startMembershipCheckout(returnTo) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { type: 'membership', returnTo },
  })
  if (error) throw error
  if (!data?.url) throw new Error('Checkout session did not return a URL.')
  window.location.href = data.url
}

// Every course is included in the membership (see migration 0013) — the
// video is still served through this RPC rather than reading
// courses.video_url directly, since RLS can't hide a single column on an
// otherwise-visible row, and the RPC is what actually checks the caller's
// tier + subscription status (or a completed standalone purchase — see
// migration 0015).
export async function fetchCourseVideoUrl(courseId) {
  const { data, error } = await supabase.rpc('get_course_video_url', { p_course_id: courseId })
  if (error) throw error
  return data
}

// One-time standalone purchase of a single course — for the public
// "Courses & Mentorship" catalog (/programs), where someone not ready to
// subscribe can still buy access to just one course. Every course is
// already free with an active membership; this is the alternate path.
export async function startCoursePurchase(courseId) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { type: 'course', courseId },
  })
  if (error) throw error
  if (!data?.url) throw new Error('Checkout session did not return a URL.')
  window.location.href = data.url
}

export function formatPrice(cents) {
  if (!cents) return 'Free'
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

// Fetches active Stripe Prices (id + amount + currency + interval) alongside
// their Product name, via the list-stripe-products Edge Function — never
// called directly from a component, only through this wrapper, so Stripe is
// only ever reached from server-side code. Admin-only: the function itself
// rejects with a 403 for a non-admin caller. Cached server-side for 5
// minutes; pass refresh=true (e.g. a "Refresh from Stripe" button) to bypass
// that cache and force a live re-fetch.
export async function listStripeProducts(refresh = false) {
  const { data, error } = await supabase.functions.invoke('list-stripe-products', {
    body: { refresh },
  })
  if (error) throw error
  return data || []
}

// Pure formatting helper — no supabase/network dependency — so it can be
// unit-tested on its own (see billing.test.js) without touching the rest of
// this module. Turns one { productName, amount, currency, interval } row
// from listStripeProducts() into the label shown in the
// CourseDetailsPanel dropdown, e.g. "Foundations $497.00 (one-time)" or
// "Membership $49.00 per month". `amount` is in cents, as Stripe returns it;
// `interval` is null for a one-time price, else Stripe's recurring interval
// ('month', 'year', etc).
export function formatStripeProductLabel({ productName, amount, currency, interval }) {
  const amountLabel = formatStripeAmount(amount, currency)
  return interval ? `${productName} ${amountLabel} per ${interval}` : `${productName} ${amountLabel} (one-time)`
}

function formatStripeAmount(amount, currency) {
  if (amount == null) return 'Custom pricing'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${(currency || '').toUpperCase()}`
  }
}

// Everything the Payment History page needs, in one call to the
// get-billing-summary Edge Function (which reads live Stripe data server-side
// — membership charges aren't stored in our DB, only subscription_status is).
// Returns:
//   {
//     hasStripeCustomer: boolean,
//     membership: null | {
//       status,                 // profile.subscription_status: pending|active|failed|cancelled
//       cancelAtPeriodEnd,      // boolean — a cancellation is already scheduled
//       currentPeriodEnd,       // ISO string | null — access-through / renewal date
//       upcomingAmountCents,    // next charge, or null (e.g. cancelling)
//       upcomingCurrency,
//       upcomingDate,           // ISO string | null
//     },
//     transactions: [{         // membership invoices + course purchases, newest-first
//       id, type,               // 'membership' | 'course'
//       description,            // 'Monthly membership' | course title
//       date,                   // ISO string
//       amountCents, currency,
//       status,                 // membership: paid|open|draft|uncollectible|void ; course: completed|pending|failed
//       receiptUrl,             // hosted Stripe invoice URL, or null
//     }]
//   }
export async function fetchBillingSummary() {
  const { data, error } = await supabase.functions.invoke('get-billing-summary')
  if (error) throw error
  return data
}

// Schedules (cancel = true) or clears (cancel = false) cancellation of the
// caller's membership at the end of the current billing period — see the
// cancel-subscription Edge Function. Returns { cancelAtPeriodEnd,
// currentPeriodEnd }. The member keeps access until the period ends; the
// subscription_status flip to 'cancelled' happens later via the webhook.
export async function setMembershipCancellation(cancel) {
  const { data, error } = await supabase.functions.invoke('cancel-subscription', {
    body: { action: cancel ? 'cancel' : 'resume' },
  })
  if (error) throw error
  return data
}
