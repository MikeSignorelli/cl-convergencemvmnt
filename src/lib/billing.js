import { supabase } from './supabaseClient'

// Calls the create-checkout-session Edge Function (see
// supabase/functions/README.md) and redirects the browser to the Stripe
// Checkout URL it returns. Requires real Stripe keys to be configured on
// the Edge Function before this will actually work end to end.
export async function startMembershipCheckout() {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { type: 'membership' },
  })
  if (error) throw error
  if (!data?.url) throw new Error('Checkout session did not return a URL.')
  window.location.href = data.url
}

// Every course is included in the membership (see migration 0013) — the
// video is still served through this RPC rather than reading
// courses.video_url directly, since RLS can't hide a single column on an
// otherwise-visible row, and the RPC is what actually checks the caller's
// tier + subscription status.
export async function fetchCourseVideoUrl(courseId) {
  const { data, error } = await supabase.rpc('get_course_video_url', { p_course_id: courseId })
  if (error) throw error
  return data
}
