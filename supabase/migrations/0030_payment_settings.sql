-- Lets an admin configure the Stripe API key pair from within the app
-- itself (Settings -> Stripe), instead of only via Supabase Dashboard ->
-- Edge Function Secrets. The secret key is write-only from any client's
-- point of view: RLS lets an admin INSERT/UPDATE it, but the column itself
-- is REVOKEd from anon/authenticated SELECT (same technique already used
-- for course_lessons.video_url, migration 0017) so it can never be read
-- back by any client -- including the admin's own browser right after
-- saving it. A security-definer function (get_stripe_settings) exposes
-- just the publishable key (not sensitive) plus a masked last-4-characters
-- hint for the secret key, so the admin UI can show "a key is set" without
-- ever re-fetching the real value.
--
-- Edge functions (create-checkout-session, stripe-webhook,
-- get-billing-summary, cancel-subscription) read this table via their
-- existing service-role client -- REVOKE only targets anon/authenticated,
-- so service_role keeps full access -- falling back to the Deno.env
-- STRIPE_SECRET_KEY secret if no row/value is set yet, so a project that
-- hasn't touched this new UI keeps working exactly as before.
--
-- Singleton-per-provider table: `provider` is the primary key, and only a
-- single 'stripe' row is ever expected today.
create table if not exists public.payment_settings (
  provider text primary key,
  publishable_key text,
  secret_key text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

alter table public.payment_settings enable row level security;

drop policy if exists "admins manage payment settings" on public.payment_settings;
create policy "admins manage payment settings"
  on public.payment_settings for all
  to authenticated
  using (public.is_caller_admin())
  with check (public.is_caller_admin());

-- The secret itself is never selectable by a client, even an admin --
-- only service_role (used exclusively by edge functions) can read it.
-- (Writing it via UPDATE/INSERT is unaffected -- this only revokes SELECT.)
revoke select (secret_key) on public.payment_settings from anon, authenticated;

-- Read-only, admin-facing view of the current Stripe configuration.
-- Returns one row of nulls (never an error, never zero rows) for a
-- non-admin caller or before any settings have been saved, so the client
-- never has to special-case "no row yet" vs "not allowed" differently.
create or replace function public.get_stripe_settings()
returns table (
  publishable_key text,
  has_secret_key boolean,
  secret_key_hint text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_row record;
begin
  if not public.is_caller_admin() then
    return query select null::text, false, null::text;
    return;
  end if;

  select ps.publishable_key, ps.secret_key
  into v_row
  from public.payment_settings ps
  where ps.provider = 'stripe';

  if not found then
    return query select null::text, false, null::text;
    return;
  end if;

  return query select
    v_row.publishable_key,
    (v_row.secret_key is not null and v_row.secret_key <> ''),
    case when v_row.secret_key is not null and length(v_row.secret_key) >= 4
      then '****' || right(v_row.secret_key, 4)
      else null end;
end;
$$;

grant execute on function public.get_stripe_settings() to authenticated;
