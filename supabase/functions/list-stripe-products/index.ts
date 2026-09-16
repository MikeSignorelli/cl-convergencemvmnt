// Lists active Stripe Prices (with their Product's name) so the admin course
// editor can offer a dropdown instead of a free-text Stripe Price ID field
// (see src/components/admin/CourseDetailsPanel.jsx). Admin-only: this is the
// first Edge Function in this codebase to enforce a server-side
// profiles.tier === 'admin' check — RLS alone can't gate a call out to the
// Stripe API, so it's done explicitly below.
//
// Runs with the caller's own JWT (verify_jwt stays on, same as
// create-checkout-session) purely to identify who's asking; the actual
// admin decision is made here against a service-role read of their profile,
// never trusting anything the client claims about itself.
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

// Simple in-process cache: reused across invocations of the same warm Deno
// isolate so switching tabs / re-opening the course editor doesn't re-hit
// Stripe every time. Not shared across isolates/regions and cleared on cold
// start — that's fine, it's just an optimization, not a correctness
// requirement (a 403 for non-admins is always checked fresh, never cached).
let cachedProducts: unknown[] | null = null
let cachedAt = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function mapPriceToProduct(price: Stripe.Price) {
  const product = price.product as Stripe.Product | Stripe.DeletedProduct
  return {
    productName: 'deleted' in product && product.deleted ? '(deleted product)' : (product as Stripe.Product).name,
    productId: product.id,
    priceId: price.id,
    amount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval ?? null,
  }
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
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const user = userData.user

    // The first-ever server-side admin gate in this codebase: every other
    // Edge Function either doesn't need one or relies on RLS/is_caller_admin()
    // for its own table writes. Listing Stripe Prices has no RLS to lean on,
    // so it's checked directly here against profiles.tier.
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError || !profile || profile.tier !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Body is optional — a plain GET-style call with no body should still
    // work, so a missing/invalid JSON body just means "don't force a refresh".
    let refresh = false
    try {
      const body = await req.json()
      refresh = body?.refresh === true
    } catch {
      refresh = false
    }

    const isCacheFresh = cachedProducts && Date.now() - cachedAt < CACHE_TTL_MS
    if (!refresh && isCacheFresh) {
      return new Response(JSON.stringify(cachedProducts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product'],
    })

    const products = prices.data.map(mapPriceToProduct)
    cachedProducts = products
    cachedAt = Date.now()

    return new Response(JSON.stringify(products), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('list-stripe-products error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
