-- Foundation for the progress-tracking module (client-side equivalent:
-- src/lib/progress.js + supabase/functions/progress-*). Purely additive:
-- no existing column is renamed or dropped, no existing row is deleted.
--
-- lesson_progress keeps its name and existing columns (user_id, lesson_id,
-- course_id, seconds, duration, percent, completed, updated_at) -- this IS
-- the table the spec calls "episode_progress"; renaming it would touch
-- every existing RLS policy/consumer for no functional gain, so it's
-- extended in place instead. `seconds` already serves as last_position
-- (Vimeo's timeupdate gives current playhead position, not accumulated
-- watch time) -- the columns below add what's missing: a monotonic
-- furthest-point marker, real accumulated watch time (distinct from
-- position), and the bookkeeping resume/completion/re-link rules need.
alter table public.lesson_progress
  add column if not exists max_position_seconds numeric not null default 0,
  add column if not exists seconds_watched numeric not null default 0,
  add column if not exists vimeo_id text,
  add column if not exists playback_rate numeric,
  add column if not exists completed_manually boolean not null default false,
  add column if not exists started_over_at timestamptz,
  add column if not exists first_watched_at timestamptz;

-- Best-effort backfill for existing rows so the new columns aren't all
-- zero/null the moment this ships: existing position is a reasonable floor
-- for both "furthest point reached" and "time watched" (it's an
-- underestimate for seconds_watched if the user seeked around, but never an
-- overestimate that could wrongly mark something complete).
update public.lesson_progress
set max_position_seconds = greatest(max_position_seconds, seconds),
    seconds_watched = greatest(seconds_watched, seconds),
    first_watched_at = coalesce(first_watched_at, updated_at)
where max_position_seconds = 0 or seconds_watched = 0 or first_watched_at is null;

-- Per-course rollup, one row per (user, course) -- avoids recomputing
-- "X of Y complete" / percent from every lesson_progress row on every course
-- page load. Kept in sync by the progress-heartbeat/-complete/-start-over
-- Edge Functions (in-transaction on every write) and by the admin
-- recompute job (bulk, on episode add/remove/reorder or drift repair).
create table if not exists public.course_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  total_episodes integer not null default 0,
  completed_episodes integer not null default 0,
  percent numeric not null default 0,
  total_seconds_watched numeric not null default 0,
  last_episode_id uuid references public.course_lessons(id) on delete set null,
  last_watched_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  primary key (user_id, course_id)
);

create index if not exists course_progress_user_last_watched_idx
  on public.course_progress (user_id, last_watched_at desc);

alter table public.course_progress enable row level security;

create policy "members view their own course progress, admins view all"
  on public.course_progress for select to authenticated
  using (user_id = auth.uid() or public.is_caller_admin());

-- No client insert/update/delete policy: every write goes through the
-- progress Edge Functions (service role), same rule as course_purchases /
-- billing_transactions -- never something a client can spoof directly.

create index if not exists lesson_progress_user_last_watched_idx
  on public.lesson_progress (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- canPlayEpisode, centralized. Both parameterized by an explicit p_user_id
-- (not just auth.uid()) so the same function serves three callers: a
-- member checking their own access (p_user_id = auth.uid()), an admin
-- checking a specific member's access (Admin -> user detail), and the
-- service-role recompute job checking every enrolled user against every
-- episode. The guard below stops a normal authenticated user from probing
-- a DIFFERENT user's access/progress by passing an arbitrary p_user_id --
-- it only relaxes when auth.uid() is null, i.e. the caller has no request
-- JWT at all (a trusted service-role Edge Function call, never a browser).
create or replace function public.can_access_course(p_user_id uuid, p_course_id uuid)
returns table(allowed boolean, reason text)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_is_admin boolean;
  v_active boolean;
begin
  if auth.uid() is not null and p_user_id <> auth.uid() and not public.is_caller_admin() then
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

-- Episode-level gate: entitlement (above) + release date + sequential-access,
-- OR a free-preview bypass. Fixes a real pre-existing bug in the process:
-- the admin's "Always accessible (free preview, ignores membership/purchase
-- gating)" checkbox (is_open_access) never actually bypassed entitlement in
-- get_lesson_video_url below -- it only ever skipped the sequential check.
-- A free-preview episode still respects its own release date (a "coming
-- soon" preview shouldn't play early just because it's free) and still
-- requires a real logged-in caller (p_user_id not null) -- it only skips
-- the membership/purchase check and the sequential-order requirement.
create or replace function public.can_play_episode(p_user_id uuid, p_lesson_id uuid)
returns table(allowed boolean, reason text)
language plpgsql
security definer
set search_path = public
stable
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
  if auth.uid() is not null and p_user_id <> auth.uid() and not public.is_caller_admin() then
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

grant execute on function public.can_access_course(uuid, uuid) to authenticated;
grant execute on function public.can_play_episode(uuid, uuid) to authenticated;

-- get_course_video_url / get_lesson_video_url now just delegate to the
-- functions above -- same external behavior as migration 0034 (course
-- access), plus the free-preview fix (lesson access), with zero duplicated
-- entitlement logic left to drift out of sync between the two.
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
  select ca.allowed into v_allowed from public.can_access_course(auth.uid(), p_course_id) ca;
  if not coalesce(v_allowed, false) then
    return null;
  end if;
  select video_url into v_video_url from public.courses where id = p_course_id;
  return v_video_url;
end;
$$;

create or replace function public.get_lesson_video_url(p_lesson_id uuid)
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
  select cp.allowed into v_allowed from public.can_play_episode(auth.uid(), p_lesson_id) cp;
  if not coalesce(v_allowed, false) then
    return null;
  end if;
  select video_url into v_video_url from public.course_lessons where id = p_lesson_id;
  return v_video_url;
end;
$$;
