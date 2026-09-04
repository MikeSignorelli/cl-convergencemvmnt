-- Membership billing status lives directly on profiles (one subscription per
-- member, same flat-column convention as tier/display_name/etc). Stripe
-- correlates back to a member by client_reference_id = profiles.id — no
-- separate "membership_id" concept needed since profiles.id already is one.
alter table public.profiles
  add column if not exists subscription_status text not null default 'pending'
    check (subscription_status in ('pending', 'active', 'failed', 'cancelled')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists profiles_stripe_customer_id_idx on public.profiles (stripe_customer_id);
create index if not exists profiles_stripe_subscription_id_idx on public.profiles (stripe_subscription_id);

-- Per-course pricing. stripe_price_id is the Stripe Price object backing
-- checkout for this course; null until an admin sets a price and the
-- corresponding Price is created on the Stripe side.
alter table public.courses
  add column if not exists price_cents integer not null default 0,
  add column if not exists stripe_price_id text;

-- Course access is now purchase-based, not tier-based (see migration 0007's
-- visible_tiers, which this supersedes for courses specifically — the
-- column is left in place rather than dropped, in case tier-based
-- filtering is wanted again later, but access checks no longer read it).
create table if not exists public.course_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.course_purchases enable row level security;

create policy "members can view their own purchases"
  on public.course_purchases for select to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'admin'
  ));

-- No client INSERT/UPDATE policy: rows are only ever written by the
-- create-checkout-session and stripe-webhook Edge Functions, both using the
-- service role key (which bypasses RLS entirely) — never by the browser
-- directly, since purchase status must only ever be set by a real Stripe
-- event, not something a client could spoof.

-- Courses: browsing is open to any signed-in member regardless of tier or
-- purchase (title/description/price are not sensitive) — access to the
-- actual video_url is gated separately via get_course_video_url() below.
-- RLS alone can't hide a single column on an otherwise-visible row (it's
-- row-level, not column-level) — a member could still `select video_url`
-- directly and read every course's link, purchased or not. The REVOKE
-- below closes that: only a security-definer function (which executes as
-- the table owner, unaffected by grants on `authenticated`) can read the
-- column at all; the row-level policy above still governs which *rows*
-- are visible for every other column.
drop policy if exists "members can view courses visible to their tier" on public.courses;
create policy "authenticated members can browse all courses"
  on public.courses for select to authenticated
  using (true);

revoke select (video_url) on public.courses from authenticated, anon;

create or replace function public.get_course_video_url(p_course_id uuid)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_video_url text;
  v_allowed boolean;
begin
  select exists (
    select 1 from public.profiles where id = auth.uid() and tier = 'admin'
  ) or exists (
    select 1 from public.course_purchases
    where user_id = auth.uid() and course_id = p_course_id and status = 'completed'
  ) into v_allowed;

  if not v_allowed then
    return null;
  end if;

  select video_url into v_video_url from public.courses where id = p_course_id;
  return v_video_url;
end;
$$;

grant execute on function public.get_course_video_url(uuid) to authenticated;

-- Admin-only: the Upload Courses table needs to show/link video_url for
-- every course, which the column-level REVOKE above blocks for a direct
-- client select — this security-definer function is the one place that's
-- allowed to read it in bulk, gated by is_caller_admin() same as
-- admin_list_members().
create or replace function public.admin_list_courses()
returns table (
  id uuid,
  title text,
  description text,
  visible_tiers text[],
  thumbnail_path text,
  video_url text,
  price_cents integer,
  stripe_price_id text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.title, c.description, c.visible_tiers, c.thumbnail_path,
         c.video_url, c.price_cents, c.stripe_price_id, c.created_at
  from public.courses c
  where public.is_caller_admin()
  order by c.created_at desc;
$$;

grant execute on function public.admin_list_courses() to authenticated;

-- Admin member list now also surfaces billing status, so the Members page
-- can show it without a second round trip. Needs an explicit DROP first --
-- create or replace can't change an existing function's OUT-parameter row
-- type (adding subscription_status), only its body.
drop function if exists public.admin_list_members();

create or replace function public.admin_list_members()
returns table (
  id uuid,
  email text,
  username text,
  display_name text,
  city text,
  tier text,
  created_at timestamptz,
  subscription_status text
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, u.email, p.username, p.display_name, p.city, p.tier, p.created_at, p.subscription_status
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_caller_admin()
  order by p.created_at desc;
$$;

-- Simple key-value store for the Admin Settings page (subscription terms
-- copy, email template text, etc.) — deliberately schemaless (jsonb value)
-- since these are free-form admin-editable strings, not structured data
-- anything else in the app needs to query against.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

alter table public.app_settings enable row level security;

create policy "anyone can read app settings"
  on public.app_settings for select to authenticated, anon
  using (true);

create policy "admins can manage app settings"
  on public.app_settings for all to authenticated
  using (public.is_caller_admin())
  with check (public.is_caller_admin());
