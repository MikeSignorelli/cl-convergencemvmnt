-- 0027_sequential_lesson_gate.sql
--
-- courses.access_mode and course_lessons.is_open_access (both added in 0021)
-- exist in the schema but get_lesson_video_url (0017) has never actually
-- read them -- every course, sequential or not, has been gated purely by the
-- drip date + membership/purchase check ever since. This migration teaches
-- the function the sequential rule: for a course an admin has explicitly
-- switched to access_mode = 'sequential' (via the Details tab), a non-admin
-- must have a completed=true public.lesson_progress row for the immediately
-- preceding lesson (ordered the same way every other lesson list in the app
-- already orders episodes -- week_number, nulls-last, then position, then
-- created_at; see EpisodesPanel.jsx's weekSlot()/UNASSIGNED_WEEK_SLOT, which
-- is exactly what position already encodes) before this lesson's video is
-- served. The very first lesson in that order never needs a predecessor, and
-- a lesson flagged is_open_access (0021) always skips this check -- both
-- match the "preview episode" affordance the admin panel already exposes.
--
-- access_mode defaults to 'open' (0021) and this whole block is skipped
-- outright for 'open' courses, so EVERY existing course -- every one of them
-- is still 'open' unless an admin has since flipped it -- keeps exactly its
-- current behavior. This activates only for a course an admin deliberately
-- sets to "Sequential" on the Course Details panel. The existing drip-date
-- gate and course-access (membership/purchase) check below are untouched,
-- both in logic and in order -- this is purely an additional condition
-- layered on top, checked only once course access has already passed.

create or replace function public.get_lesson_video_url(p_lesson_id uuid)
returns text
language plpgsql
security definer
set search_path = public
stable
as $fn$
declare
  v_course_id uuid;
  v_release_at timestamptz;
  v_is_open_access boolean;
  v_video_url text;
  v_is_admin boolean;
  v_allowed boolean;
  v_access_mode text;
  v_prev_lesson_id uuid;
  v_prev_completed boolean;
begin
  select course_id, release_at, is_open_access
  into v_course_id, v_release_at, v_is_open_access
  from public.course_lessons where id = p_lesson_id;
  if v_course_id is null then
    return null;
  end if;

  v_is_admin := public.is_caller_admin();

  -- Drip gate: non-admins can't fetch the video before its release date.
  if not v_is_admin and v_release_at is not null and v_release_at > now() then
    return null;
  end if;

  select v_is_admin or exists (
    select 1 from public.profiles p
    join public.courses c on c.id = v_course_id
    where p.id = auth.uid()
      and p.subscription_status = 'active'
      and p.tier = any(c.visible_tiers)
  ) or exists (
    select 1 from public.course_purchases
    where user_id = auth.uid() and course_id = v_course_id and status = 'completed'
  ) into v_allowed;

  if not v_allowed then
    return null;
  end if;

  -- Sequential-access gate (new): only ever considered for a non-admin on a
  -- lesson that isn't flagged is_open_access. Every existing course is
  -- access_mode = 'open' by default, which short-circuits this whole block.
  if not v_is_admin and not v_is_open_access then
    select access_mode into v_access_mode from public.courses where id = v_course_id;

    if v_access_mode = 'sequential' then
      -- Same ordering listCourseLessons()/admin_list_lessons() already use
      -- for display (position asc), just spelled out with its week_number/
      -- created_at tiebreakers so "first" and "immediately previous" are
      -- unambiguous even before an admin has touched a legacy row's position.
      -- lag() over that ordering gives every lesson its predecessor's id in
      -- one pass; null means "nothing comes before this one" (it's first).
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

      -- Not the first lesson in the course -> a predecessor exists, and it
      -- must be completed by this user.
      if v_prev_lesson_id is not null then
        select completed into v_prev_completed
        from public.lesson_progress
        where user_id = auth.uid() and lesson_id = v_prev_lesson_id;

        if not coalesce(v_prev_completed, false) then
          return null;
        end if;
      end if;
    end if;
  end if;

  select video_url into v_video_url from public.course_lessons where id = p_lesson_id;
  return v_video_url;
end;
$fn$;

grant execute on function public.get_lesson_video_url(uuid) to authenticated;
