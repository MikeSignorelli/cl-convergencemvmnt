import { supabase } from './supabaseClient'

// Both call the create-checkout-session Edge Function (see
// supabase/functions/README.md) and redirect the browser to the Stripe
// Checkout URL it returns. Requires real Stripe keys to be configured on
// the Edge Function before this will actually work end to end.
async function startCheckout(body) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', { body })
  if (error) throw error
  if (!data?.url) throw new Error('Checkout session did not return a URL.')
  window.location.href = data.url
}

export async function startMembershipCheckout() {
  await startCheckout({ type: 'membership' })
}

export async function startCourseCheckout(courseId) {
  await startCheckout({ type: 'course', courseId })
}

export async function getMyPurchasedCourseIds() {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return new Set()

  const { data, error } = await supabase
    .from('course_purchases')
    .select('course_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
  if (error) throw error
  return new Set((data || []).map((row) => row.course_id))
}

// Purchased content is served through this RPC rather than reading
// courses.video_url directly, since RLS can't hide a single column on an
// otherwise-visible row — see get_course_video_url() in migration 0011.
export async function fetchCourseVideoUrl(courseId) {
  const { data, error } = await supabase.rpc('get_course_video_url', { p_course_id: courseId })
  if (error) throw error
  return data
}

export function formatPrice(cents) {
  if (!cents) return 'Free'
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}
