// Creates a Stripe Checkout Session for either the $49/mo membership
// subscription or a one-time course purchase, and returns its URL for the
// client to redirect to. Runs with the caller's own JWT (verify_jwt stays
// on, the default) so `user` below is always the authenticated member —
// never trust a user id passed in the request body for this reason.
//
// NOT LIVE-TESTABLE without real Stripe keys — see supabase/functions/README.md
// for the exact secrets this function needs and how to set them.
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Two clients: one scoped to the caller's own JWT (to identify who's
    // asking, respecting RLS), one with the service role (to write
    // stripe_customer_id / a pending course_purchases row, which RLS
    // deliberately blocks from the client — see migration 0011).
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
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const user = userData.user

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, username, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'No member profile found for this account' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Reuse the Stripe Customer across membership + every course purchase,
    // rather than creating a new one per checkout.
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await adminClient.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const body = await req.json()
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://demo.convergencemvmnt.com'

    if (body.type === 'membership') {
      const membershipPriceId = Deno.env.get('STRIPE_MEMBERSHIP_PRICE_ID')
      if (!membershipPriceId) {
        return new Response(JSON.stringify({ error: 'STRIPE_MEMBERSHIP_PRICE_ID is not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        client_reference_id: user.id, // correlates the webhook back to this member — the "membership_id" link
        line_items: [{ price: membershipPriceId, quantity: 1 }],
        success_url: `${siteUrl}/dashboard?checkout=success`,
        cancel_url: `${siteUrl}/dashboard?checkout=cancelled`,
        metadata: { supabase_user_id: user.id, type: 'membership' },
      })

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.type === 'course') {
      const courseId = body.courseId
      if (!courseId) {
        return new Response(JSON.stringify({ error: 'courseId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: course, error: courseError } = await adminClient
        .from('courses')
        .select('id, title, price_cents, stripe_price_id')
        .eq('id', courseId)
        .maybeSingle()
      if (courseError || !course) {
        return new Response(JSON.stringify({ error: 'Course not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!course.stripe_price_id) {
        return new Response(JSON.stringify({ error: 'This course has no Stripe price configured yet' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: course.stripe_price_id, quantity: 1 }],
        success_url: `${siteUrl}/courses/${courseId}?checkout=success`,
        cancel_url: `${siteUrl}/courses/${courseId}?checkout=cancelled`,
        metadata: { supabase_user_id: user.id, type: 'course', course_id: courseId },
      })

      // Recorded as 'pending' now so the Members/course-purchase views have
      // something to show immediately; the webhook flips it to 'completed'
      // (or 'failed') once Stripe actually confirms the payment.
      await adminClient.from('course_purchases').upsert(
        {
          user_id: user.id,
          course_id: courseId,
          stripe_checkout_session_id: session.id,
          status: 'pending',
        },
        { onConflict: 'user_id,course_id' }
      )

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown checkout type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('create-checkout-session error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
