-- A persisted ledger of membership (subscription invoice) charges, written
-- only by the stripe-webhook Edge Function (service role -- bypasses RLS,
-- same as course_purchases in 0011). Closes two gaps at once:
--
-- 1) Until now, membership charge HISTORY was never stored locally --
--    get-billing-summary fetched it live from stripe.invoices.list() on
--    every page load. That call (and stripe.subscriptions.retrieve()
--    alongside it) breaks the whole "Payments" page the moment the
--    configured Stripe key stops matching the account a member's
--    customer/subscription id was created under (e.g. after an admin
--    rotates the key in Settings -> Stripe, migration 0030) -- Stripe
--    resource ids are account-scoped, so an old id 404s against a new key.
-- 2) There was no admin-wide view of membership charges at all -- only a
--    single member's own history, fetched live, one Stripe account at a
--    time.
--
-- course_purchases (0011) already plays this role for one-time course
-- purchases and already lets an admin see every row (its own RLS policy
-- has no user_id restriction for admins) -- this table mirrors that shape
-- for the recurring side so an admin "Orders" view can union both.
create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  stripe_invoice_id text unique,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null check (status in ('paid', 'failed')),
  description text not null default 'Monthly membership',
  receipt_url text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists billing_transactions_user_id_idx on public.billing_transactions (user_id);
create index if not exists billing_transactions_occurred_at_idx on public.billing_transactions (occurred_at desc);

alter table public.billing_transactions enable row level security;

create policy "members view their own billing transactions, admins view all"
  on public.billing_transactions for select to authenticated
  using (user_id = auth.uid() or public.is_caller_admin());

-- No insert/update/delete policy for anon/authenticated: rows are only ever
-- written by stripe-webhook via the service role key, driven by a real
-- Stripe event -- never something a client could spoof, same rule as
-- course_purchases.
