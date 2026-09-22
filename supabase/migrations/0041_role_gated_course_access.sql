-- Reinstates tier/role as a real access gate (it was made display-only in
-- migration 0034 -- "active membership unlocks every course"). Per explicit
-- product decision: a course assigned to specific role(s) via
-- courses.visible_tiers is now only playable by a member holding one of
-- those roles -- an active membership alone does NOT unlock a role-mismatched
-- course. The one override: an individual purchase of that SPECIFIC course
-- (course_purchases, status='completed') always unlocks it regardless of
-- role, same as it already does for a non-member today.
--
-- New reason code 'wrong_role': the caller has an active membership but
-- courses.visible_tiers doesn't include their tier -- distinct from
-- 'not_entitled' (no membership and no purchase at all) so the client can
-- show "this course isn't included for your role -- buy it individually"
-- instead of a generic paywall.
--
-- can_play_episode / course_episode_access / get_course_video_url /
-- get_lesson_video_url all delegate to this function already (this
-- session's single-source-of-truth pattern), so they inherit the new rule
-- with no changes of their own.
create or replace function public.can_access_course(p_user_id uuid, p_course_id uuid)
returns table(allowed boolean, reason text)
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_tier text;
  v_active boolean;
  v_visible_tiers text[];
begin
  if auth.role() is distinct from 'service_role'
     and p_user_id is distinct from auth.uid()
     and not public.is_caller_admin() then
    return query select false, 'not_entitled'::text;
    return;
  end if;

  select p.tier, p.subscription_status = 'active' into v_tier, v_active
  from public.profiles p where p.id = p_user_id;

  if v_tier = 'admin' then
    return query select true, 'ok'::text;
    return;
  end if;

  -- Purchase override: always unlocks this one course, regardless of role.
  if exists (
    select 1 from public.course_purchases
    where user_id = p_user_id and course_id = p_course_id and status = 'completed'
  ) then
    return query select true, 'ok'::text;
    return;
  end if;

  if coalesce(v_active, false) then
    select visible_tiers into v_visible_tiers from public.courses where id = p_course_id;
    if v_tier = any(v_visible_tiers) then
      return query select true, 'ok'::text;
      return;
    end if;
    return query select false, 'wrong_role'::text;
    return;
  end if;

  return query select false, 'not_entitled'::text;
end;
$$;
