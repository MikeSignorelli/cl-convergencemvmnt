# Stripe Edge Functions — setup

Two functions here are fully written but cannot be exercised until real Stripe
keys exist for this project. Nothing about the app code is waiting on this —
everything else (schema, UI, access control) already works against the
`pending` state these produce by default.

## 1. Deploy the functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## 2. Set the secrets (Supabase Dashboard → Edge Functions → Secrets, or CLI)

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_MEMBERSHIP_PRICE_ID=price_...   # the $49/mo recurring Price
supabase secrets set SITE_URL=https://demo.convergencemvmnt.com
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to
every Edge Function — no need to set those yourself.

## 3. Create the Stripe objects

- A recurring **Price** for the $49/mo membership → its id is
  `STRIPE_MEMBERSHIP_PRICE_ID` above. Every course is included in this one
  membership (see migration 0013) — there's no per-course Price to create.

## 4. Point a Stripe webhook at the deployed function

In the Stripe Dashboard → Developers → Webhooks → Add endpoint:

```
https://<project-ref>.supabase.co/functions/v1/stripe-webhook
```

Subscribe it to at least: `checkout.session.completed`,
`customer.subscription.updated`, `customer.subscription.deleted`,
`invoice.payment_failed`. Copy the endpoint's signing secret into
`STRIPE_WEBHOOK_SECRET` above.

## 5. Test before going live

```bash
stripe listen --forward-to https://<project-ref>.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

Once this is done, `src/lib/billing.js`'s `startMembershipCheckout()` will
work exactly as written — nothing in the frontend needs to change.
