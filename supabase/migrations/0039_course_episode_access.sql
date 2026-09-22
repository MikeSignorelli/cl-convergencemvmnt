-- Bulk per-episode access for one course, for GET /progress/courses/:id
-- (the episode map needs allowed/reason per episode). Rather than the
-- calling Edge Function looping N HTTP calls to can_play_episode (one per
-- episode -- slow, and a second place the access rule could drift out of
-- sync), this loops INSIDE Postgres and calls can_play_episode for each
-- lesson directly -- same connection, no network round trip per episode,
-- and zero duplicated entitlement logic.
create or replace function public.course_episode_access(p_user_id uuid, p_course_id uuid)
returns table (lesson_id uuid, allowed boolean, reason text)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_lesson record;
  v_result record;
begin
  for v_lesson in select cl.id from public.course_lessons cl where cl.course_id = p_course_id loop
    select cp.allowed, cp.reason into v_result from public.can_play_episode(p_user_id, v_lesson.id) cp;
    lesson_id := v_lesson.id;
    allowed := v_result.allowed;
    reason := v_result.reason;
    return next;
  end loop;
end;
$$;

grant execute on function public.course_episode_access(uuid, uuid) to authenticated;
