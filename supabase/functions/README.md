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
  `STRIPE_MEMBERSHIP_PRICE_ID` above.
- A one-time **Price** per standalone course sold on the public "Courses &
  Mentorship" catalog (`/programs`) — every course is already included free
  in the membership (migration 0013), but a course with `price_cents > 0`
  (migration 0015) is also purchasable on its own, for people not ready to
  subscribe. Create the Price in Stripe, then set that course's
  `stripe_price_id` column via the admin Upload Courses page.

## 4. Point a Stripe webhook at the deployed function

In the Stripe Dashboard → Developers → Webhooks → Add endpoint:

```
https://<project-ref>.supabase.co/functions/v1/stripe-webhook
```

Subscribe it to at least: `checkout.session.completed`,
`customer.subscription.updated`, `customer.subscription.deleted`,
`invoice.payment_failed`, `payment_intent.payment_failed`. Copy the
endpoint's signing secret into `STRIPE_WEBHOOK_SECRET` above.

## 5. Test before going live

```bash
stripe listen --forward-to https://<project-ref>.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

Once this is done, `src/lib/billing.js`'s `startMembershipCheckout()` and
`startCoursePurchase()` will work exactly as written — nothing in the
frontend needs to change.

## 6. Other Edge Functions in this project

One more function lives alongside the Stripe ones above, for admin/course
management. It isn't Stripe-webhook-shaped (no signature to verify), so it's
documented separately here rather than folded into the numbered steps above.

### course-health-check

A scheduled sweep over `course_lessons` that flags episodes an admin should
look at: a missing/unparseable video link, an episode releasing soon with
no video yet, or a previously-good Vimeo link that no longer resolves.
Findings are written to `course_health_flags` (migration 0029), which the
admin course list reads to show a health banner.

- **Deploy:** `supabase functions deploy course-health-check`
- **Set the secret** (Supabase Dashboard → Edge Functions → Secrets, or CLI):

  ```bash
  supabase secrets set COURSE_HEALTH_SECRET=some-long-random-string
  ```

- **Auth — two ways in:**
  - the external scheduler sends the `x-cron-secret` header, checked
    against `COURSE_HEALTH_SECRET` above — the same shared-secret pattern
    `send-setup-reminders` uses with its own `SETUP_REMINDER_SECRET`; or
  - an admin's browser calls it directly for an on-demand run (the "Check
    Vimeo links now" button on the admin course list), authenticated with
    that admin's normal Supabase Auth JWT and a server-side `profiles.tier
    === 'admin'` check.

  Because of that second caller, `verify_jwt = true` for this function
  (unlike `send-setup-reminders`, which is `false`) — the gateway just
  requires *some* valid JWT (the scheduler's own anon key satisfies that),
  and the function's code decides whether the caller is the cron job or an
  admin.
- **Scheduling:** no in-repo cron config — call it on a recurring basis from
  the Supabase Dashboard's Cron scheduler (or any external scheduler) the
  same way `send-setup-reminders` is scheduled, POSTing to
  `https://<project-ref>.supabase.co/functions/v1/course-health-check` with
  the `x-cron-secret` header set to `COURSE_HEALTH_SECRET`.
- **Query/body options:** `dryRun` (bool) computes and returns findings
  without writing them; `daysAhead` (int, default 3) sets the "upcoming
  episode" notice window in days.

### create-live-session / delete-live-session

Live sessions (migration 0008, extended by 0036) are real Zoom meetings, not
manually pasted links. These two admin-only functions call Zoom's
Server-to-Server OAuth API on the admin's behalf.

- **Deploy:** `supabase functions deploy create-live-session` and
  `supabase functions deploy delete-live-session`.
- **Credentials:** unlike Stripe, there's no env-var secret to set here —
  Zoom's Account ID / Client ID / Client Secret are pasted into the admin
  Settings → Live sessions tab (same write-only-secret pattern as
  Settings → Payments) and stored in `zoom_settings`, read only by these two
  functions via the service role. Create the Server-to-Server OAuth app at
  https://marketplace.zoom.us (Build App → Server-to-Server OAuth).
- **Auth:** both require a normal Supabase Auth JWT belonging to an admin
  (`profiles.tier = 'admin'`, checked server-side) — `verify_jwt = true`.
- **create-live-session:** exchanges the stored credentials for a Zoom
  access token, calls `POST /v2/users/me/meetings` with
  `join_before_host: true` (so members can join at the scheduled time with
  no admin action to "start" the meeting), then saves a `live_sessions` row
  with the real `join_url` and `zoom_meeting_id` Zoom returns. Returns a
  clear error if Zoom isn't configured yet, or if Zoom rejects the
  credentials.
- **delete-live-session:** deletes the Zoom meeting (best-effort — a
  Zoom-side failure doesn't block removing the row) and then the
  `live_sessions` row.
- **NOT LIVE-TESTABLE** until real Zoom Server-to-Server OAuth credentials
  are pasted into Settings → Live sessions.
