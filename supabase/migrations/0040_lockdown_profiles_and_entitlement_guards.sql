-- Fixes three issues found in this session's security audit:
--
-- 1. subscription_status/stripe_customer_id/stripe_subscription_id were
--    client-writable by the row's own owner (the profiles UPDATE RLS policy
--    has no column restriction, and enforce_tier_immutability only guards
--    `tier`) -- any signed-in member could grant themselves active
--    membership with a plain client `.update({subscription_status:'active'})`
--    call, bypassing the entire paywall.
--
-- 2. profiles was SELECT-able by anyone, including anon with no session at
--    all (`using (true)` for `public`), exposing every member's Stripe
--    customer/subscription IDs with zero auth. Confirmed live via an
--    unauthenticated curl request against the anon key.
--
-- 3. can_access_course/can_play_episode's anti-impersonation guard used
--    `auth.uid() is not null and p_user_id <> auth.uid()`, which evaluates
--    to NULL (not TRUE) when auth.uid() is null -- an anonymous caller
--    skipped the guard entirely and could query any user's entitlement
--    status for any course/episode with no auth. Confirmed live via an
--    unauthenticated RPC call.

-- ---------------------------------------------------------------------
-- 1. Block client-originated writes to the billing fields, mirroring the
--    existing enforce_tier_immutability escape hatches: auth.uid() is null
--    (service-role / stripe-webhook path) or the caller is already an admin
--    can still write these; every other client cannot. Neither signup path
--    (onboardingSignup.js) ever sets these fields itself -- they're left at
--    their column defaults ('pending' / null / null) -- so this can't break
--    signup.
-- ---------------------------------------------------------------------
create or replace function public.enforce_billing_fields_immutability()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if exists (select 1 from public.profiles where id = auth.uid() and tier = 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.subscription_status is distinct from 'pending'
       or new.stripe_customer_id is not null
       or new.stripe_subscription_id is not null then
      raise exception 'billing fields cannot be set through signup';
    end if;
    return new;
  end if;

  if new.subscription_status is distinct from old.subscription_status
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id then
    raise exception 'billing fields cannot be changed via the client API; they are set by the payment webhook';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_billing_fields_immutability on public.profiles;
create trigger profiles_enforce_billing_fields_immutability
  before insert or update on public.profiles
  for each row execute function public.enforce_billing_fields_immutability();

-- ---------------------------------------------------------------------
-- 2. Row-level lockdown: a member can only see their own row; admin sees
--    everyone (needed by Analytics.jsx and Orders.jsx, both admin-only
--    pages that read tier/subscription_status/display_name/username across
--    every profile via the regular authenticated client, not service role).
-- ---------------------------------------------------------------------
drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are readable by owner or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_caller_admin());

-- Defense in depth: anon has no legitimate reason to touch profiles at all
-- (every real page that reads it now requires a session) -- revoke the
-- whole-table grant rather than relying on RLS alone, same pattern used to
-- close the course_lessons.video_url leak in migration 0031.
revoke all on public.profiles from anon;

-- ---------------------------------------------------------------------
-- 3. Fix the anonymous-bypass guard. auth.role() reads the JWT `role`
--    claim ('anon' | 'authenticated' | 'service_role'), unlike auth.uid()
--    which is null for BOTH an anonymous caller and a service-role Edge
--    Function call -- the six progress-* Edge Functions all call these
--    RPCs via their service-role adminClient (auth.uid() is null there by
--    design, after already verifying the real caller's JWT themselves), so
--    the guard must distinguish those from a genuinely anonymous request
--    rather than exempting every auth.uid()-is-null caller.
-- ---------------------------------------------------------------------
create or replace function public.can_access_course(p_user_id uuid, p_course_id uuid)
returns table(allowed boolean, reason text)
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_is_admin boolean;
  v_active boolean;
begin
  if auth.role() is distinct from 'service_role'
     and p_user_id is distinct from auth.uid()
     and not public.is_caller_admin() then
    return query select false, 'not_entitled'::text;
    return;
  end if;

  select p.tier = 'admin' into v_is_admin from public.profiles p where p.id = p_user_id;
  if coalesce(v_is_admin, false) then
    return query select true, 'ok'::text;
    return;
  end if;

  select p.subscription_status = 'active' into v_active from public.profiles p where p.id = p_user_id;
  if coalesce(v_active, false) then
    return query select true, 'ok'::text;
    return;
  end if;

  if exists (
    select 1 from public.course_purchases
    where user_id = p_user_id and course_id = p_course_id and status = 'completed'
  ) then
    return query select true, 'ok'::text;
    return;
  end if;

  return query select false, 'not_entitled'::text;
end;
$$;

create or replace function public.can_play_episode(p_user_id uuid, p_lesson_id uuid)
returns table(allowed boolean, reason text)
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_course_id uuid;
  v_release_at timestamptz;
  v_is_open_access boolean;
  v_is_admin boolean;
  v_access_mode text;
  v_prev_lesson_id uuid;
  v_prev_completed boolean;
  v_course_allowed boolean;
begin
  if auth.role() is distinct from 'service_role'
     and p_user_id is distinct from auth.uid()
     and not public.is_caller_admin() then
    return query select false, 'not_entitled'::text;
    return;
  end if;

  select course_id, release_at, is_open_access
  into v_course_id, v_release_at, v_is_open_access
  from public.course_lessons where id = p_lesson_id;

  if v_course_id is null then
    return query select false, 'not_entitled'::text;
    return;
  end if;

  select p.tier = 'admin' into v_is_admin from public.profiles p where p.id = p_user_id;
  v_is_admin := coalesce(v_is_admin, false);

  if not v_is_admin and v_release_at is not null and v_release_at > now() then
    return query select false, 'not_released'::text;
    return;
  end if;

  if not v_is_admin then
    if v_is_open_access then
      if p_user_id is null then
        return query select false, 'not_entitled'::text;
        return;
      end if;
    else
      select ca.allowed into v_course_allowed from public.can_access_course(p_user_id, v_course_id) ca;
      if not coalesce(v_course_allowed, false) then
        return query select false, 'not_entitled'::text;
        return;
      end if;
    end if;
  end if;

  if not v_is_admin and not v_is_open_access then
    select access_mode into v_access_mode from public.courses where id = v_course_id;

    if v_access_mode = 'sequential' then
      select ordered.prev_id into v_prev_lesson_id
      from (
        select id,
               lag(id) over (
                 order by week_number nulls last, position asc, created_at asc
               ) as prev_id
        from public.course_lessons
        where course_id = v_course_id
      ) ordered
      where ordered.id = p_lesson_id;

      if v_prev_lesson_id is not null then
        select completed into v_prev_completed
        from public.lesson_progress
        where user_id = p_user_id and lesson_id = v_prev_lesson_id;

        if not coalesce(v_prev_completed, false) then
          return query select false, 'complete_previous'::text;
          return;
        end if;
      end if;
    end if;
  end if;

  return query select true, 'ok'::text;
end;
$$;
